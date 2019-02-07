import { getFragment, getCollection, getFragmentName } from 'meteor/vulcan:core';
/**
 * Extract collectionName from collection
 * or collection from collectionName
 * @param {*} param0
 */
export const extractCollectionInfo = ({ collectionName, collection }) => {
  if (!(collectionName || collection)) throw new Error('Please specify either collection or collectionName');
  const _collectionName = collectionName || collection.options.collectionName;
  const _collection = collection || getCollection(collectionName);
  return { collection: _collection, collectionName: _collectionName };
};
/**
 * Extract fragmentName from fragment
 * or fragment from fragmentName
 */
export const extractFragmentInfo = ({ fragment, fragmentName, extraVariables }, collectionName) => {
  if (!(fragment || fragmentName || collectionName))
    throw new Error('Please specify either fragment or fragmentName, or pass a collectionName');
  if (fragment) {
    return {
      fragment,
      fragmentName: fragmentName || getFragmentName(fragment),
      // LESSWRONG MODIFICATION: Allow the passing of extraVariables so that you can have field-specific queries
      extraVariablesString: getExtraVariablesString(extraVariables)
    };
  } else {
    const _fragmentName = fragmentName || `${collectionName}DefaultFragment`;
    return {
      fragment: getFragment(_fragmentName),
      fragmentName: _fragmentName
    };
  }
};

function getExtraVariablesString(extraVariables) {
  if (extraVariables) {
    return Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  } 
  return ''
}