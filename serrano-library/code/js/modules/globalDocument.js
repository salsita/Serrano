/**
 * Created by tomasnovella on 7/7/14.
 */

var _ = require('../libs/lodash');
var exceptions = require('./exceptions');

/**
 * Get the second-level domain.
 * @param {string} hostname
 * @returns {string} domain The domain name up to the second level.
 * @example
 * getSecondLevelDomain('www.blog.google.com')
 * // => 'google.com'
 *
 * getSecondLevelDomain('*')
 * // => '*'
 */
function getSecondLevelDomain(hostname) {
  return hostname.split('.').slice(-2).join('.');
}

/**
 * Script that parses URI parts and returns a neat object.
 * Better solution would be to create a document.createElement('a') and let the browser parse it,
 * but in unit tests we do not have `document`. So hence the replacement.
 *
 * @param {string} href URI.
 * @returns {Object| undefined} Resulting object, see example.
 * @example
 * parseUri("http://blog.example.com/");
 * // => {
 * //  "protocol": "http:",
 * //  "host": "example.com",
 * //  "hostname": "example.com",
 * //  "port": undefined,
 * //  "pathname": "/"
 * //  "search": "",
 * //  "hash": "",
 * //  "href": "http://blog.example.com/",
 * //  "secondLevelDomain": "example.com"
 * // };
 */
function parseUri(href) {
  var match = href.match(/^([^:]+\:)[/]{2,3}(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
  if (!match) {
    return;
  }

  var obj = {
    href: match[0],
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  };
  obj.secondLevelDomain = getSecondLevelDomain(obj.hostname);

  return obj;
}


/**
 * All the document items from the global document are preprocessed into hashtable.
 * Contains key-value pairs where
 * 'key' {string} domain up to the second level. Represents a "hash" of a global doc item.
 * 'value' {Array} Array of rules items.
 *
 * @example
 * Valid keys are 'example.com', 'javascripting.com' and 'wikipedia.org'.
 * Invalid keys are 'www.wikipedia.org', 'en.wikipedia.org' and '.org'
 */
var globalDocumentHashTable = {};


/**
 * Creates a hash table from the given global document.
 * @param doc Global document.
 * @returns {Object} Returns the final hashtable.
 */
function createHashTable(doc) {
  var ht = {};
  _.forEach(doc, function(item) {
    var domain = item.domain;
    if (!domain) {
      throw new exceptions.RuntimeError('Global document does not have domain item!');
    }
    var key = getSecondLevelDomain(domain);
    if (!ht[key]) {
      ht[key] = [];
    }

    // Priority. Internal parameter used for sorting document items inside a bucket.
    // It's reverted to negative so that lower numbers imply higher priority, otherwise
    // I would have to reverse() the buckets in the end
    // and that would make _.sortBy 'unstable' i.e. if multiple doc-items of same
    // priority matched a given uri, the last one would be selected.
    var priority = (item.domain.split('.').length - 1) * 10;

    if (item.regexp) {
      item.regexp = new RegExp(item.regexp);
      priority += 2; // regexp si favoured to path
    }
    if(item.path) {
      priority += 1; // path is favoured to nothing at all
    }

    item.priority = -priority;

    ht[key].push(item);
  });

  return ht;
}

/**
 * Unloads the document by clearing the hashtable.
 */
function unloadDocument() {
  globalDocumentHashTable = {};
}

/**
 * Merges the `globalDocumentHashTable` with hashtable created out of `doc`.
 * @param doc document
 */
function appendDocument(doc) {
  var ht = createHashTable(doc);
  // merge
  _.forEach(ht, function(val, key) {
    if (!globalDocumentHashTable[key]) {
      globalDocumentHashTable[key] = [];
    }
    var conc = globalDocumentHashTable[key].concat(ht[key]);
    globalDocumentHashTable[key] = _.sortBy(conc, 'priority');
  });
}

/**
 * Loads the new document and creates hashes from for quicker access.
 * @param document
 */
function loadDocument(document) {
  unloadDocument();
  appendDocument(document);
}

/**
 * Checks whether the item can be applied to the URI.
 * @param item doc item.
 * @param {Object} parsedUri URI parsed by `parseUri` function
 * @returns {boolean}
 */
function isMatchingDocumentItem(item, parsedUri) {
  // the domain in the doc-item must be contained in the real domain
  if ( (parsedUri.hostname.indexOf(item.domain) === -1 && item.domain !== '*') ||
    // when regex is set, it must match
    (item.regexp && _.isEmpty(parsedUri.href.match(item.regexp)) ) ||
    //when path is set, it must match
    (item.path && item.path !== parsedUri.pathname) ) {
    return false;
  }

  return true;
}

/**
 * Returns the first rules object from global doc that matches the url.
 * '*' is considered bucket for the default rules objects that is selected when no
 * other rules bucket was selected.
 * @param {string} uri
 * @returns {Object| undefined} Returns rules-object, if found.
 */
function getRules(uri) {
  if (uri.split('://').length === 1) { // because without that '.hostname' does not work
    throw new TypeError('You must include protocol in the URI!');
  }

  var parsedUri = parseUri(uri);
  var bucket = globalDocumentHashTable[parsedUri.secondLevelDomain];
  if (_.isEmpty(bucket)) { // nothing found, checks out the default bucket
    bucket = globalDocumentHashTable['*'];
  }

  if (!_.isEmpty(bucket)) {
    var item = _.find(bucket, function(item) {
      return isMatchingDocumentItem(item, parsedUri);
    });
    return item.rules;
  }
}

module.exports = {
  loadDocument: loadDocument,
  unloadDocument: unloadDocument,
  getRules: getRules,

  // private methods, for unittesting only
  parseUri: parseUri,
  getSecondLevelDomain: getSecondLevelDomain,
  createHashTable: createHashTable,
  appendDocument: appendDocument,
  isMatchingDocumentItem: isMatchingDocumentItem,
  getHashTable: function() {return globalDocumentHashTable;}
};
