import type { FetchResult } from '@apollo/client';
import { RouterLocation } from '../../lib/vulcan-lib';

declare global {

// This `any` should actually be `CSSProperties` from either MUI or JSS but this
// currently causes an avalanche of type errors, I think due to the fact that
// we're stuck on a precambrian version of MUI. Upgrading would probably fix this.
type JssStyles<ClassKey extends string = string> = Record<ClassKey, AnyBecauseHard>;

type JssStylesCallback<ClassKey extends string = string> = (
  theme: ThemeType,
) => JssStyles<ClassKey>;

type ClassesType<
  Styles extends JssStylesCallback<ClassKey> = JssStylesCallback<string>,
  ClassKey extends string = string
> = Readonly<Record<keyof ReturnType<Styles>, string>>;

interface WithStylesProps {
  classes: ClassesType,
}

type WithMessagesMessage = string|{id?: string, properties?: any, messageString?: string, type?: string, action?: any};

interface WithMessagesProps {
  messages: Array<WithMessagesMessage>,
  flash: (message: WithMessagesMessage)=>void,
  clear: ()=>void,
}

interface WithUserProps {
  currentUser: UsersCurrent|null,
}

interface WithTrackingProps {
  captureEvent: any,
}

interface WithTimezoneProps {
  timezone: string,
  timezoneIsKnown: boolean,
}

interface WithNavigationProps {
  history: any,
}

interface WithLocationProps {
  location: RouterLocation,
}

interface WithDialogProps {
  openDialog: any,
}

interface WithGlobalKeydownProps {
  addKeydownListener: any,
}

interface WithHoverProps {
  hover: boolean,
  anchorEl: HTMLElement|null,
}

interface WithApolloProps {
  client: any;
}

// This is a bit arcane. I think of this basically as a type "function" that
// says, for a given collection base, I am the DbObject extension it is using.
// https://stackoverflow.com/questions/63631364/infer-nested-generic-types-in-typescript/63631544#63631544
type DbObjectForCollectionBase<C> = C extends CollectionBase<infer T> ? T : never

type NullablePartial<T> = { [K in keyof T]?: T[K]|null|undefined }

type WithUpdateFunction<T extends CollectionBase<U>, U extends DbObject = DbObjectForCollectionBase<T>> = (args: {
  selector: MongoSelector<U>,
  data: NullablePartial<U>,
  extraVariables?: any,
}) => Promise<FetchResult>;

type WithCreateFunction<T extends CollectionBase<U>, U extends DbObject = DbObjectForCollectionBase<T>> = (args: {
  data: NullablePartial<U>,
  extraVariables?: any,
}) => Promise<FetchResult>;

interface WithUpdateUserProps {
  updateUser: WithUpdateFunction<UsersCollection>
}
interface WithUpdateCommentProps {
  updateComment: WithUpdateFunction<CommentsCollection>
}
interface WithUpdatePostProps {
  updatePost: WithUpdateFunction<PostsCollection>
}

}
