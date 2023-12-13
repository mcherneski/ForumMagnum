import * as _ from 'underscore';
import { Posts } from '../../lib/collections/posts/collection';
import { createNotifications } from '../notificationCallbacksHelpers';
import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { ckEditorApi, ckEditorApiHelpers, documentHelpers } from './ckEditorApi';
import { createMutator, updateMutator } from '../vulcan-lib';
import CkEditorUserSessions from '../../lib/collections/ckEditorUserSessions/collection';

interface CkEditorUserConnectionChange {
  user: { id: string },
  document: { id: string },
  connected_users: Array<{ id: string }>,
}

// Hacky lil' solution for now 
const testWebHookLocally = async () => {
  // eslint-disable-next-line no-console
  console.log("Running local CK Editor webhook test... ")
  const syntheticData = [
    // {
    //   "environment_id": "rQvD3VnunXZu34m86e5f",
    //   "event": "collaboration.user.disconnected",
    //   "payload": {
    //     "user": { "id": "PvfS86fQfr2Zx8Lsj" },
    //     "document": { "id": "i5THpCMGhEGfSi2p9-edit" },
    //     "connected_users": []
    //   },
    //   "sent_at": "2023-12-12T22:00:33.357Z"
    // },
    {
      "environment_id": "rQvD3VnunXZu34m86e5f",
      "event": "collaboration.user.connected",
      "payload": {
        "user": { "id": "KynyugbGz9kgFGe4A" },
        "document": { "id": "D5mCL6dTSGnNedy4d-edit" },
        "connected_users": [{ "id": "KynyugbGz9kgFGe4A" }]
      },
      "sent_at": "2023-12-11T22:00:33.357Z"
    },
    // {
    //   "environment_id": "rQvD3VnunXZu34m86e5f",
    //   "event": "collaboration.user.connected",
    //   "payload": {
    //     "user": { "id": "c4BywbHytbB5zLdA4" },
    //     "document": { "id": "BsAt7bhGJqgsi7vpo-edit" },
    //     "connected_users": [{ "id": "c4BywbHytbB5zLdA4" }]
    //   },
    //   "sent_at": "2023-12-12T22:02:39.523Z"
    // }
  ];

  for (let i = 0; i < syntheticData.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await handleCkEditorWebhook(syntheticData[i]);
    // eslint-disable-next-line no-console
    console.log("Sent webhook test " + i)
  }
}


addStaticRoute('/ckeditor-webhook', async ({query}, req, res, next) => {
  if (req.method !== "POST") {
    res.statusCode = 405; // Method not allowed
    res.end("ckeditor-webhook should receive POST");
    return;
  }
  
  const body = (req as any).body; //Type system doesn't know body-parser middleware has filled this in
  if (body) {
    await handleCkEditorWebhook(body);
  }
  
  res.end("ok");
});

// Handle a CkEditor webhook. These are documented at:
//   https://ckeditor.com/docs/cs/latest/guides/webhooks/events.html
// Webhook payloads don't seem to have Typescript types exported anywhere, but
// they're pretty simple so we define them inline.
async function handleCkEditorWebhook(message: any) {
  // eslint-disable-next-line no-console
  console.log(`Got CkEditor webhook: ${JSON.stringify(message)}`);
  
  const {environment_id, event, payload, sent_at} = message;
  
  switch (event) {
    case "commentthread.all.removed":
      break;
    case "comment.added": {
      interface CkEditorCommentAdded {
        document: { id: string },
        comment: {
          id: string,
          created_at: string,
          content: string,
          thread_id: string,
          attributes: any,
          user: { id: string }
        },
      };
      const commentAddedPayload = payload as CkEditorCommentAdded;
      
      const thread = await ckEditorApi.fetchCkEditorCommentThread(payload?.comment?.thread_id);
      const commentersInThread: string[] = _.uniq(thread.map(comment => comment?.user?.id));
      
      await notifyCkEditorCommentAdded({
        commenterUserId: payload?.comment?.user?.id,
        commentHtml: payload?.comment?.content,
        postId: documentHelpers.ckEditorDocumentIdToPostId(payload?.document?.id),
        commentersInThread,
      });
      break;
    }
    
    case "storage.document.saved": {
      // https://ckeditor.com/docs/cs/latest/guides/webhooks/events.html
      // "Triggered when the document data is saved."
      interface CkEditorDocumentSaved {
        document: {
          id: string,
          saved_at: string,
          download_url: string,
        }
      }
      const documentSavedPayload = payload as CkEditorDocumentSaved;
      const ckEditorDocumentId = documentSavedPayload?.document?.id;
      const postId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId);
      const documentContents = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorDocumentId);
      await documentHelpers.saveOrUpdateDocumentRevision(postId, documentContents);
      break;
    }
    case "collaboration.document.updated": {
      // https://ckeditor.com/docs/cs/latest/guides/webhooks/events.html
      // According to documentation, this is:
      // "Triggered every 5 minutes or 5000 versions when the content of the collaboration session is being updated. The event will also be emitted when the last user disconnects from a collaboration session."
      // 
      interface CkEditorDocumentUpdated {
        document: {
          id: string
          updated_at: string
          version: number
        }
      }
      const documentUpdatedPayload = payload as CkEditorDocumentUpdated;
      const ckEditorDocumentId = documentUpdatedPayload?.document?.id;
      const postId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId);
      const documentContents = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorDocumentId);
      await documentHelpers.saveOrUpdateDocumentRevision(postId, documentContents);
      break;
    }
    
    case "comment.updated":
    case "comment.removed":
    case "commentthread.removed":
    case "commentthread.restored":
    case "collaboration.user.connected": {
      const userConnectedPayload = payload as CkEditorUserConnectionChange;
      const userId = userConnectedPayload?.user?.id;
      const documentId = userConnectedPayload?.document?.id;

      const result = await createMutator({
        collection: CkEditorUserSessions,
        document: {
          userId,
          documentId
        },
        validate: false,
      });

      break
    }
    case "document.user.connected":
    case "collaboration.user.disconnected": {
      const userDisconnectedPayload = payload as CkEditorUserConnectionChange;
      const userId = userDisconnectedPayload?.user?.id;
      const documentId = userDisconnectedPayload?.document?.id;
      const userSession = await CkEditorUserSessions.findOne({userId, documentId }, {sort:{createdAt: -1}});

      if (userSession) {
        const result = await updateMutator({
          collection: CkEditorUserSessions,
          documentId: userSession._id, 
          set: { endedAt: new Date(sent_at) },
          validate: false,
        });
      }
      break
    }
    case "document.user.disconnected": {
      interface CkEditorUserConnectionChange {
        user: { id: string },
        document: { id: string },
        connected_users: Array<{ id: string }>,
      }
      const userDisconnectedPayload = payload as CkEditorUserConnectionChange;
      const userId = userDisconnectedPayload?.user?.id;
      const ckEditorDocumentId = userDisconnectedPayload?.document?.id;
      const documentContents = await ckEditorApiHelpers.fetchCkEditorCloudStorageDocumentHtml(ckEditorDocumentId);
      const postId = documentHelpers.ckEditorDocumentIdToPostId(ckEditorDocumentId);
      await documentHelpers.saveDocumentRevision(userId, postId, documentContents);

      break;
    }
    case "document.removed":
    case "storage.document.removed":
    case "storage.document.save.failed":
    case "suggestion.accepted":
    case "suggestion.rejected":
    case "suggestion.added":
    case "suggestion.removed":
    case "suggestion.restored":
      break;
  }
}

async function notifyCkEditorCommentAdded({commenterUserId, commentHtml, postId, commentersInThread}: {
  commenterUserId: string,
  commentHtml: string,
  postId: string,
  commentersInThread: string[],
}) {
  const post = await Posts.findOne({_id: postId});
  if (!post) throw new Error(`Couldn't find post for CkEditor comment notification: ${postId}`);
  
  // Notify the main author of the post, the coauthors if any, and everyone
  // who's commented in the thread. Then filter out the person who wrote the
  // comment themself.
  const coauthorUserIds = post.coauthorStatuses?.filter(status=>status.confirmed).map(status => status.userId) ?? [];

  const usersToNotify = _.uniq(_.filter(
    [post.userId, ...coauthorUserIds, ...commentersInThread],
    u=>(!!u && u!==commenterUserId)
  ));
  
  // eslint-disable-next-line no-console
  console.log(`New CkEditor comment. Notifying users: ${JSON.stringify(usersToNotify)}`);
  
  await createNotifications({
    userIds: usersToNotify,
    notificationType: "newCommentOnDraft",
    documentType: "post",
    documentId: postId,
    extraData: {
      senderUserID: commenterUserId,
      commentHtml: commentHtml,
    },
  });
}
