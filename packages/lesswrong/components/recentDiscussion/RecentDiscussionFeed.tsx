import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { useCurrentUser } from '../common/withUser';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { useGlobalKeydown } from '../common/withGlobalKeydown';

const RecentDiscussionFeed = ({
  commentsLimit, maxAgeHours, af,
  title="Recent Discussion", shortformButton=true
}: {
  commentsLimit?: number,
  maxAgeHours?: number,
  af?: boolean,
  title?: string,
  shortformButton?: boolean,
}) => {
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showShortformFeed, setShowShortformFeed] = useState(false);
  const currentUser = useCurrentUser();
  const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads
  
  useGlobalKeydown(event => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode == F_Key) {
      setExpandAllThreads(true);
    }
  });
  
  const toggleShortformFeed = useCallback(
    () => {
      setShowShortformFeed(!showShortformFeed);
    },
    [setShowShortformFeed, showShortformFeed]
  );
  
  const { SingleColumnSection, SectionTitle, SectionButton, ShortformSubmitForm, Loading, AnalyticsInViewTracker, LoadMore, MixedTypeFeed, RecentDiscussionThread, CommentsNode, TagRevisionItem, RecentDiscussionTag } = Components

  return (
    <SingleColumnSection>
      <SectionTitle title={title}>
        {currentUser?.isReviewed && shortformButton && <div onClick={toggleShortformFeed}>
          <SectionButton>
            <AddBoxIcon />
            New Shortform Post
          </SectionButton>
        </div>}
      </SectionTitle>
      {showShortformFeed && <ShortformSubmitForm />}
      <MixedTypeFeed
        firstPageSize={10}
        pageSize={20}
        resolverName="RecentDiscussionFeed"
        sortKeyType="Date"
        resolverArgs={{ af: 'Boolean' }}
        resolverArgsValues={{ af }}
        fragmentArgs={{
          commentsLimit: 'Int',
          maxAgeHours: 'Int',
          tagCommentsLimit: 'Int',
        }}
        fragmentArgsValues={{
          commentsLimit, maxAgeHours,
          tagCommentsLimit: commentsLimit,
        }}
        renderers={{
          postCommented: {
            fragmentName: "PostsRecentDiscussion",
            render: (post: PostsRecentDiscussion) => <div>
              <RecentDiscussionThread
                post={post}
                comments={post.recentComments}
                expandAllThreads={expandAll}
              />
            </div>
          },
          tagDiscussed: {
            fragmentName: "TagRecentDiscussion",
            render: (tag: TagRecentDiscussion) => <div>
              <RecentDiscussionTag
                tag={tag}
                comments={tag.recentComments}
                expandAllThreads={expandAll}
              />
            </div>
          },
          tagRevised: {
            fragmentName: "RevisionTagFragment",
            render: (revision: RevisionTagFragment) => <div>
              {revision.tag && <TagRevisionItem
                revision={revision}
                documentId={revision.documentId}
                linkUrl={Tags.getRevisionLink(revision.tag, revision.version)}
              />}
            </div>,
          },
        }}
      />
    </SingleColumnSection>
  )
}

const RecentDiscussionFeedComponent = registerComponent('RecentDiscussionFeed', RecentDiscussionFeed, {
  areEqual: "auto",
});

declare global {
  interface ComponentTypes {
    RecentDiscussionFeed: typeof RecentDiscussionFeedComponent,
  }
}

