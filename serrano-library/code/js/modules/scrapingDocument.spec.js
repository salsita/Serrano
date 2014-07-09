/**
 * Created by tomasnovella on 7/8/14.
 */

var assert = require('assert');
var _ = require('../libs/lodash');

var scrapingDoc = require('./scrapingDocument');

describe('scraping document', function() {
  /*global afterEach */
  afterEach(function() { // clean-up
    scrapingDoc.unloadDocument();
  });

  it('should check if the url is parsed correctly into parts', function() {
    assert.deepEqual(scrapingDoc.parseUri('http://www.blog.google.com/foo/bar?var1=val1#hash'),
      {
        protocol:'http:',
        host:'www.blog.google.com',
        hostname:'www.blog.google.com',
        port: undefined,
        pathname:'/foo/bar',
        search: '?var1=val1',
        hash: '#hash',
        href: 'http://www.blog.google.com/foo/bar?var1=val1#hash',
        secondLevelDomain: 'google.com'
    });

    // leading slash 'bar/'
    assert.deepEqual(scrapingDoc.parseUri('ftp://www.blog.google.com/foo/bar/?var1=val1#hash'),
      { protocol: 'ftp:',
        host: 'www.blog.google.com',
        hostname: 'www.blog.google.com',
        port: undefined,
        pathname: '/foo/bar/',
        search: '?var1=val1',
        hash: '#hash',
        href: 'ftp://www.blog.google.com/foo/bar/?var1=val1#hash',
        secondLevelDomain: 'google.com'
    });

    assert.deepEqual(scrapingDoc.parseUri('file:///www.blog.google.com/foo/bar?v=l&vv=ll'),
      { protocol: 'file:',
        host: 'www.blog.google.com',
        hostname: 'www.blog.google.com',
        port: undefined,
        pathname: '/foo/bar',
        search: '?v=l&vv=ll',
        hash: '',
        href: 'file:///www.blog.google.com/foo/bar?v=l&vv=ll',
        secondLevelDomain: 'google.com'
    });

    assert.strictEqual(scrapingDoc.parseUri('www.google.com'), undefined);
  });

  it('should check if the second-level domain is parsed correctly', function() {
    assert.strictEqual(scrapingDoc.getSecondLevelDomain('*'), '*');
    assert.strictEqual(scrapingDoc.getSecondLevelDomain(''), '');
    assert.strictEqual(scrapingDoc.getSecondLevelDomain('blog.google.com'), 'google.com' );
    assert.strictEqual(scrapingDoc.getSecondLevelDomain('www.blog.google.com'), 'google.com');
    assert.strictEqual(scrapingDoc.getSecondLevelDomain('google.com'), 'google.com');
  });

  it('should check if a hash table is correctly created from the scraping doc', function() {
    // the items are not correct scraping units, this is just a simplified structure
    var doc = [
      { domain: 'google.com',unit: 1 },
      { strictDomain: 'blog.google.com', blah: 3, unit: 2 },
      { domain: 'javascripting.com', unit: 3 }
    ];

    var ht = scrapingDoc.createHashTable(doc);
    assert(ht['google.com'].length === 2);
    assert.deepEqual(ht['google.com'], [
      { domain: 'google.com', priority: 0, unit: 1 },
      { strictDomain: 'blog.google.com', priority: 10, blah: 3,unit: 2 }
    ]);


    assert(ht['javascripting.com'].length === 1);
    assert.deepEqual(ht['javascripting.com'], [{domain: 'javascripting.com', priority: 0, unit:3}]);

    assert.ifError(ht.nonsense);
  });

  it('should check the `appendDocument` function', function() {
    var doc1 = [{ domain: 'google.com',unit: 1 },
      {domain: 'javascripting.com', unit: 3 }
    ];

    var doc2 = [{
      strictDomain: 'blog.google.com', blah: 3, unit: 2
    }];

    var combinedDoc = {
     'google.com':
       [{ strictDomain: 'blog.google.com', blah: 3, priority: 10, unit: 2 },
         { domain: 'google.com', unit: 1, priority: 0}
        ],

      'javascripting.com': [{ domain: 'javascripting.com', priority: 0, unit: 3 }]
    };

    scrapingDoc.unloadDocument();
    scrapingDoc.appendDocument(doc1);
    scrapingDoc.appendDocument(doc2);
    assert.deepEqual(scrapingDoc.getDocument(), combinedDoc);
  });

  it('should test if the correct document item matches given URI', function() {
    var uri = 'http://maps.google.com/mymap?du=bist';
    var doc = [
      { strictDomain: 'google.com', unit: 1 }, // false
      { strictDomain: 'maps.google.com', unit: 2 }, // true
      { strictDomain: 'maps.google.com', path: '/mymap', unit: 3}, // true
      { strictDomain: 'maps.google.com', path: 'mymap', unit: 4}, // false, expected /mymap
      { strictDomain: 'maps.google.com', regexp: '.*?du=bist', unit: 5}, // true
      { strictDomain: 'maps.google.com', regexp: '.*?du=isst', unit: 6}, // false
      { domain: 'google.com', unit: 7}, // true
      { domain: 'google.com', path: '/mymap', unit: 8}, // true
      { domain: 'google.com', path: 'mymap', unit: 9}, // false
      { domain: 'google.com', regexp: '.*mymap\\?du', unit: 10}, // true
      { domain: 'google.com', regexp: '.*mymap\\?er', unit: 11}, // false
      { domain: 'mapy.seznam.cz', unit: 12}, // false
      { domain: 'foo.com', unit: 13} // false
    ];

    var resItems = _.filter(doc, function(item){
      return scrapingDoc.isMatchingDocumentItem(item, uri);
    });

    assert.deepEqual(_.pluck(resItems, 'unit'), [2, 3, 5, 7, 8, 10]);
  });

  it('should check if the correct scraping unit is fetched to a given URI', function() {
    var doc = [
      { strictDomain: 'google.com', unit: 1 },
      { strictDomain: 'maps.google.com', unit: 2 },
      { strictDomain: 'maps.google.com', path: '/mymap', unit: 3},
      { strictDomain: 'maps.google.com', path: 'mymap', unit: 4},
      { strictDomain: 'maps.google.com', regexp: '.*?du=bist', unit: 5},
      { strictDomain: 'maps.google.com', regexp: '.*?du=isst', unit: 6},
      { domain: 'google.com', unit: 7},
      { domain: 'google.com', path: '/mymap', unit: 8},
      { domain: 'google.com', path: 'mymap', unit: 9},
      { domain: 'google.com', regexp: '.*mymap\\?du', unit: 10},
      { domain: 'google.com', regexp: '.*mymap\\?er', unit: 11},
      { domain: 'mapy.seznam.cz', unit: 12},
      { domain: 'foo.com', unit: 13},
      { domain: '*', unit: 42}
    ];

    scrapingDoc.loadDocument(doc);

    function _eq(uri, unit) {
      assert.strictEqual(scrapingDoc.getScrapingUnit(uri), unit);
    }

    _eq('http://google.com/', 1);
    _eq('http://maps.google.com/', 2);
    _eq('http://maps.google.com/mymap', 3);
    // _eq(nothing, 4)
    _eq('http://maps.google.com/buhahaha?du=bist', 5);
    _eq('http://maps.google.com/buhahaha?du=bistUndIsst', 5);
    _eq('http://mapy.seznam.cz/buhahaha?du=bistUndIsst', 12);
    _eq('http://github.cz/buhahaha?du=bistUndIsst', 42);
  });
});
