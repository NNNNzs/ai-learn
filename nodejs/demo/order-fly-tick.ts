import { createOpenAI, defaultModel, QWEN_MODEL } from '../provider/openai';
import { orderFlyTickPrompt } from '../prompt/order_fly_tick_prompt';
import readlineSync from 'readline-sync';
import { input } from '@inquirer/prompts';
import { clearTag } from '../utils/parseTag';
import { StreamXMLParser } from '../utils/StreamXMLParser';

export async function orderFlyTickAwait() {
  const openai = createOpenAI();

  const question = await input({ message: orderFlyTickPrompt.value[1].content as string });
  orderFlyTickPrompt.value.push({ role: "user", content: `<answer>${question}</answer>` });

  while (true) {
    const response = await openai.chat.completions.create({
      model: defaultModel,
      messages: orderFlyTickPrompt.value,
    });
    const content = response.choices[0].message.content;
    if (content) {
      if (content.includes('<question>')) {
        const question = content.match(/<question>(.*?)<\/question>/)?.[1];
        const finish = content.match(/<finish>(.*?)<\/finish>/)?.[1];
        if (question) {
          orderFlyTickPrompt.value.push({ role: "assistant", content: `<question>${question}</question>` });
          const newAnswer = readlineSync.question(question);
          orderFlyTickPrompt.value.push({ role: "user", content: `<answer>${newAnswer}</answer>` });
        }
        if (finish) {
          orderFlyTickPrompt.value.push({ role: "assistant", content: `<finish>${finish}</finish>` });
          console.log(finish);
          break
        }
      }
    }
  }
}



export async function orderFlyTickStreamXML() {
  const openai = createOpenAI();
  const welcomeMessage = clearTag(orderFlyTickPrompt.value[1].content as string, 'question');
  const question = await input({ message: welcomeMessage });
  orderFlyTickPrompt.value.push({ role: "user", content: `<answer>${question}</answer>` });

  while (true) {
    const response = await openai.chat.completions.create({
      model: QWEN_MODEL,
      messages: orderFlyTickPrompt.value,
      stream: true,
    });

    const parser = new StreamXMLParser({
      onQuestionChunk: (t) => process.stdout.write(t),
      onQuestionFinish: async (question) => {
        console.log("\n🤖 问题：", question);

        orderFlyTickPrompt.value.push({
          role: "assistant",
          content: `<question>${question}</question>`
        });

        const answer = readlineSync.question("> ");
        orderFlyTickPrompt.value.push({
          role: "user",
          content: `<answer>${answer}</answer>`
        });
      },
      onFinish: (msg) => {
        console.log("✅", msg);
      }
    });

    for await (const chunk of response) {
      parser.push(chunk.choices[0].delta.content ?? "");

    }
  }
}