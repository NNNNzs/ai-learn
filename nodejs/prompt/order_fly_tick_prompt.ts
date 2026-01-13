import { ref, watchEffect } from 'vue';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import fs from 'fs';
import path from 'path';
const filePath = path.resolve(import.meta.dirname, '../logs/order_fly_tick_prompt.json');


export const orderFlyTickPrompt = ref<ChatCompletionMessageParam[]>([
  {
    role: "system", content: `你是一个飞机票预定的助手，用户会通过和你问答来预定飞机票，你也一直需要向用户提问来获取更多的信息，直到足够的信息完成机票的预定信息之后，必须把所有信息都给用户确认一遍，并且确认无误之后，才能结束提问。
    如果你需要向用户提问获取信息，请使用
    <question></question>标签来包裹问题，用户回答后，直到得到所有的信息之后，使用<finish>标签来结束提问。

***上下文***
当前日期时间:${new Date().toLocaleString()}

    例子：
    <user>我要去北京的飞机票</user>
    <question>你从哪出发？</question>
    <answer>从南京出发</answer>
    <question>需要什么时候出发</question>
    <answer>明天早上</answer>
    <question>几个人</question>
    <answer>2个人</answer>
    <question>好的，明天上午8点从南京出发，2个人，票价1000元，确认预定吗？</question>
    <answer>确认</answer>
    <finish>预定成功</finish>
    `},
  { role: "assistant", content: `<question>你好，我是飞机票预定助手，请问有什么可以帮你的吗？</question>` }

])

watchEffect(() => {
  fs.writeFileSync(filePath, JSON.stringify(orderFlyTickPrompt.value, null, 2));
})