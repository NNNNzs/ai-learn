import { createOpenAI, defaultModel, QWEN_MODEL, createOpenRouter, OPEN_ROUTER_CLAUDE3_5_MODEL } from '../provider/openai';
import { orderFlyTickPrompt } from '../prompt/order_fly_tick_prompt';
import readlineSync from 'readline-sync';
import { input } from '@inquirer/prompts';
import { clearTag } from '../utils/parseTag';
import { StreamXMLParser } from '../utils/StreamXMLParser';
import { orderFlyTickPromptJSONEvent, orderFlyTickPromptJSONEventStream, orderFlyTickPromptSSE_JSONEventStream } from '../prompt/order_fly_tick_prompt';
import { watchEffect } from 'vue';
import fs from 'fs';
import path from 'path';
import { createParser } from 'eventsource-parser';


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


export async function orderFlyTickStreamJSONEvent() {
  const openai = createOpenAI();
  const filePath = path.resolve(import.meta.dirname, '../logs/order_fly_tick_prompt_json_event.json');
  watchEffect(() => {
    fs.writeFileSync(filePath, JSON.stringify(orderFlyTickPromptJSONEvent.value, null, 2));
  })

  const welcomeMessage = orderFlyTickPromptJSONEvent.value[1].content as string;

  const question = await input({ message: JSON.parse(welcomeMessage).content });
  orderFlyTickPromptJSONEvent.value.push({ role: "user", content: `{"event": "answer", "content": "${question}"}` });

  while (true) {
    const response = await openai.chat.completions.create({
      model: QWEN_MODEL,
      messages: orderFlyTickPromptJSONEvent.value,
      // stream: true,
    });

    const content = response.choices[0].message.content;
    if (content) {
      try {
        const json = JSON.parse(content);
        if (json.event === 'question') {
          const question = json.content;
          orderFlyTickPromptJSONEvent.value.push({ role: "assistant", content: `{"event": "question", "content": "${question}"}` });
          const answer = await input({ message: question });
          orderFlyTickPromptJSONEvent.value.push({ role: "user", content: `{"event": "answer", "content": "${answer}"}` });
        }
        if (json.event === 'finish') {
          console.log(json.content);
          break;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}

/**
 * @deprecated
 * @description 使用 eventsource-parser 解析 JSON Lines 协议
 */
export async function orderFlyTickStreamJSONEventStream() {
  const openai = createOpenRouter();
  const functionName = orderFlyTickStreamJSONEventStream.name;
  const filePath = path.resolve(import.meta.dirname, `../logs/${functionName}.json`);
  watchEffect(() => {
    fs.writeFileSync(filePath, JSON.stringify(orderFlyTickPromptJSONEventStream.value, null, 2));
  })

  const welcomeMessage = orderFlyTickPromptJSONEventStream.value[1].content as string;

  const question = await input({ message: JSON.parse(welcomeMessage).content });
  orderFlyTickPromptJSONEventStream.value.push({ role: "user", content: `{"event": "answer", "content": "${question}"}` });

  while (true) {
    const response = await openai.chat.completions.create({
      model: process.env.OPEN_ROUTER_GPT as string,
      messages: orderFlyTickPromptJSONEventStream.value,
      stream: true,
    });
    let msg = '';
    for await (const chunk of response) {
      const content = chunk.choices[0].delta.content;
      if (content) {
        try {
          const json = JSON.parse(content);
          console.log(json, 'json');
          if (json.event === 'question') {
            const delta = json.delta;
            if (json.done) {
              const newAnswer = await input({ message: msg });
              orderFlyTickPromptJSONEventStream.value.push({ role: "user", content: `{"event": "answer", "content": "${newAnswer}"}` });
              break;
            }
            msg += delta;
            process.stdout.write(delta);
          }
          if (json.event === 'finish') {
            if (json.done) {
              orderFlyTickPromptJSONEventStream.value.push({ role: "user", content: `{"event": "answer", "content": "${question}"}` });
              break;
            }
            break;
          }
        } catch (error) {
          console.error(error, 'error', chunk);
        }
      }
    }
    break;
  }
}



export async function orderFlyTickStreamSSE_JSONEventStream() {
  const openai = createOpenAI();
  const functionName = orderFlyTickStreamSSE_JSONEventStream.name;
  const filePath = path.resolve(import.meta.dirname, `../logs/${functionName}.json`);
  watchEffect(() => {
    fs.writeFileSync(filePath, JSON.stringify(orderFlyTickPromptSSE_JSONEventStream.value, null, 2));
  })

  const welcomeMessage = orderFlyTickPromptSSE_JSONEventStream.value[1].content as string;

  const question = await input({ message: welcomeMessage });
  orderFlyTickPromptSSE_JSONEventStream.value.push({ role: "user", content: `:${question}` });

  let isFinish = false;

  while (!isFinish) {
    const response = await openai.chat.completions.create({
      model: QWEN_MODEL,
      messages: orderFlyTickPromptSSE_JSONEventStream.value,
      stream: true,
    });
    let inData = false;
    let dataBuffer = "";
    let pendingQuestion: string | undefined = undefined; // 每次循环开始时重置

    const parser = createParser({
      onEvent: (event) => {
        if (event.event === 'question') {
          const question = event.data;
          orderFlyTickPromptSSE_JSONEventStream.value.push({ role: "assistant", content: `event: question\ndata: ${question}` });
          pendingQuestion = question;
        }
        if (event.event === 'finish') {
          const finish = event.data;
          orderFlyTickPromptSSE_JSONEventStream.value.push({ role: "assistant", content: `event: finish\ndata: ${finish}` });
          isFinish = true;
        }
      },
      onError: event => {
        console.error('error', event)
      }
    });

    for await (const chunk of response) {
      const text = chunk.choices[0].delta?.content;
      if (text) {
        parser.feed(text);
        dataBuffer += text;

        if (dataBuffer.includes("data: ")) {
          inData = true;
          dataBuffer = "";
        }

        if (inData) {
          process.stdout.write(text);
        }
      }
      if (pendingQuestion || isFinish) {
        dataBuffer = "";
        parser.reset();
        break;
      }
    }
    inData = false;


    if (pendingQuestion) {
      const answer = await input({ message: pendingQuestion });
      orderFlyTickPromptSSE_JSONEventStream.value.push({ role: "user", content: `event: answer\ndata: ${answer}` });
      pendingQuestion = undefined;
    }

  }
}
