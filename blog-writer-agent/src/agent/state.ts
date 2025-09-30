import { BaseMessage, BaseMessageLike } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  topic: Annotation<string>(),
  background: Annotation<string>(),
  references: Annotation<{ title?: string, url?: string }[]>(),
  title: Annotation<string>(),
  content: Annotation<string>(),
  keywords: Annotation<string>(),
  draft: Annotation<string>(),
  article: Annotation<string>(),
  reviewed: Annotation<{ isApproved: boolean, feedback?: string }>(),
  revised: Annotation<{ isApproved: boolean, feedback?: string }>(),
});
