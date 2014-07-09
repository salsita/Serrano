/**
 * Created by tomasnovella on 7/7/14.
 */

var _ = require('../libs/lodash');
var exceptions = require('./exceptions');

/**
 * Get the second-level domain.
 * @param {string} hostname
 * @returns {string} domane The domain name up to the second level.
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
 * Container for all scraping docs.
 * Contains key-value pairs where
 * 'key' {string} domain up to the second level. Represents a "hash" of a scraping doc item.
 * 'value' {Array} Array of scraping doc items.
 *
 * @example
 * Valid keys are 'example.com', 'javascripting.com' and 'wikipedia.org'.
 * Invalid keys are 'www.wikipedia.org', 'en.wikipedia.org' and '.org'
 */
var scrapingDocumentHashTable = {};


/**
 * Creates a hash table from the given scraping document.
 * @param doc Scraping document.
 * @returns {HashTable} Returns the final hashtable.
 */
function createHashTable(doc) {
  var ht = {};
  _.forEach(doc, function(item){
    var domain = item.strictDomain || item.domain;
    if (!domain) {
      throw new exceptions.RuntimeError('Scraping document does not have domain nor strictDomain item');
    }
    var key = getSecondLevelDomain(domain);
    if (!ht[key]) {
      ht[key] = [];
    }

    var priority = 0;
    if (item.strictDomain) {
      priority += 10;
    }
    if (item.path) {
      priority += 20;
    }
    if (item.regexp) {
      priority += 50;
    }
    item.priority = priority;
    ht[key].push(item);
  });

  return ht;
}

/**
 * Unloads the document by clearing the hashtable.
 */
function unloadDocument() {
  scrapingDocumentHashTable = {};
}

/**
 * Merges the `scrapingDocumentHashTable` with hashtable created out of `doc`.
 * @param doc document
 */
function appendDocument(doc) {
  var ht = createHashTable(doc);
  // merge
  _.forEach(ht, function(val, key) {
    if (!scrapingDocumentHashTable[key]) {
      scrapingDocumentHashTable[key] = [];
    }
    var conc = scrapingDocumentHashTable[key].concat(ht[key]);
    scrapingDocumentHashTable[key] = _.sortBy(conc, 'priority').reverse();
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
 * @param item Scraping doc item.
 * @param {string} uri URI
 * @returns {boolean}
 */
function isMatchingDocumentItem(item, uri) {
  var parsedUri = parseUri(uri);

  if (item.domain === '*' || item.strictDomain === '*' ) {
    return true;
  }

  // strictDomain requires strict match
  if (item.strictDomain && item.strictDomain !== parsedUri.hostname) {
    return false;
  }

  // domain is less strict -> either strict match, or at least
  // the second-level domains will match
  if (item.domain && item.domain !== parsedUri.hostname &&
    item.domain !== parsedUri.secondLevelDomain) {

    return false;
  }

  if (item.regexp && _.isEmpty(parsedUri.href.match(new RegExp(item.regexp))) ) {
    return false;
  }

  if(item.path && item.path !== parsedUri.pathname) {
    return false;
  }

  return true;
}

/**
 * Returns the first scraping unit from scraping doc that matches the url.
 * '*' is considered bucket for the default scraping unit that is selected when no
 * other scraping unit was selected.
 * @param {string} uri
 * @returns {Object| undefined} Returns scraping unit, if found.
 */
function getScrapingUnit(uri) {
  if (uri.split('://').length === 1) { // because without that '.hostname' does not work
    throw new TypeError('You must include protocol in the URI!');
  }


  var bucket = scrapingDocumentHashTable[parseUri(uri).secondLevelDomain];
  if (_.isEmpty(bucket)) { // nothing found, checks out the default bucket
    bucket = scrapingDocumentHashTable['*'];
  }

  if (!_.isEmpty(bucket)) {
    var item = _.find(bucket, function(item) {
      return isMatchingDocumentItem(item, uri);
    });
    return item.unit;
  }
}

module.exports = {
  loadDocument: loadDocument,
  unloadDocument: unloadDocument,
  getScrapingUnit: getScrapingUnit,

  // private methods, for unittesting only
  parseUri: parseUri,
  getSecondLevelDomain: getSecondLevelDomain,
  createHashTable: createHashTable,
  appendDocument: appendDocument,
  isMatchingDocumentItem: isMatchingDocumentItem,
  getDocument: function() {return scrapingDocumentHashTable;}
};
