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
 * @returns {Object} Returns the final hashtable.
 */
function createHashTable(doc) {
  var ht = {};
  _.forEach(doc, function(item) {
    var domain = item.domain;
    if (!domain) {
      throw new exceptions.RuntimeError('Scraping document does not have domain item!');
    }
    var key = getSecondLevelDomain(domain);
    if (!ht[key]) {
      ht[key] = [];
    }

    // Priority. Internal parameter used for sorting scraping doc items inside a bucket.
    // It's reverted to negative so that lower numbers imply higher priority, otherwise
    // I would have to reverse() the buckets in the end
    // and that would make _.sortBy 'unstable' i.e. if multiple scrap-doc-items of same
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
    scrapingDocumentHashTable[key] = _.sortBy(conc, 'priority');
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
 * @param {Object} parsedUri URI parsed by `parseUri` function
 * @returns {boolean}
 */
function isMatchingDocumentItem(item, parsedUri) {
  // the domain in the scraping-doc-item must be contained in the real domain
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
 * Returns the first scraping unit from scraping doc that matches the url.
 * '*' is considered bucket for the default scraping units that is selected when no
 * other scraping bucket was selected.
 * @param {string} uri
 * @returns {Object| undefined} Returns scraping unit, if found.
 */
function getScrapingUnit(uri) {
  if (uri.split('://').length === 1) { // because without that '.hostname' does not work
    throw new TypeError('You must include protocol in the URI!');
  }

  var parsedUri = parseUri(uri);
  var bucket = scrapingDocumentHashTable[parsedUri.secondLevelDomain];
  if (_.isEmpty(bucket)) { // nothing found, checks out the default bucket
    bucket = scrapingDocumentHashTable['*'];
  }

  if (!_.isEmpty(bucket)) {
    var item = _.find(bucket, function(item) {
      return isMatchingDocumentItem(item, parsedUri);
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
