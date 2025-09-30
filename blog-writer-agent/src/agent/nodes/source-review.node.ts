import { interrupt, Command } from '@langchain/langgraph';
import { RemoveMessage } from '@langchain/core/messages';
import { StateAnnotation } from '../state.js';

export async function sourceReviewNode(state: typeof StateAnnotation.State) {
  const { topic, background, references } = state;

  const reviewed = interrupt({
    type: 'source_review',
    payload: { topic, background, references },
  });

  if (reviewed.isApproved) {
    return new Command({
      goto: ['writer', 'seo'],
      update: {
        reviewed,
        messages: state.messages.map(message => new RemoveMessage({ id: message.id as string })),
      },
    });
  } else {
    return new Command({
      goto: 'researcher',
      update: { reviewed },
    });
  }
}
