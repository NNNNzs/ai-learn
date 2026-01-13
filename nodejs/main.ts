import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createOpenAI, defaultModel } from './provider/openai';
import { orderFlyTickPrompt } from './prompt/order_fly_tick_prompt';
import readlineSync from 'readline-sync';
import {
  orderFlyTickAwait, orderFlyTickStreamXML,
  orderFlyTickStreamJSONEvent, orderFlyTickStreamJSONEventStream,
  orderFlyTickStreamSSE_JSONEventStream
} from './demo/order-fly-tick';
import { ref, watchEffect } from 'vue';

import { clearTag } from './utils/parseTag';

// orderFlyTickAwait();
// orderFlyTickStreamXML();
// orderFlyTickStreamJSONEvent();
// orderFlyTickStreamJSONEventStream()
orderFlyTickStreamSSE_JSONEventStream()