/**
 * Created by tomasnovella on 7/8/14.
 */

var assert = require('assert');
var _ = require('../libs/lodash');

var globalDoc = require('./globalDocument');

describe('global document', function() {
  afterEach(function() { // clean-up
    globalDoc.unloadDocument();
  });

  it('should check if loading empty document returns empty object', function() {
    globalDoc.loadDocument(undefined);
    assert.deepEqual(globalDoc.getHashTable(), {});
    globalDoc.unloadDocument();
  });

  it('should check if the url is parsed correctly into parts', function() {
    assert.deepEqual(globalDoc.parseUri('http://www.blog.google.com/foo/bar?var1=val1#hash'),
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
    assert.deepEqual(globalDoc.parseUri('ftp://www.blog.google.com/foo/bar/?var1=val1#hash'),
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

    assert.deepEqual(globalDoc.parseUri('file:///www.blog.google.com/foo/bar?v=l&vv=ll'),
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

    assert.strictEqual(globalDoc.parseUri('www.google.com'), undefined);
  });

  it('should check if the second-level domain is parsed correctly', function() {
    assert.strictEqual(globalDoc.getSecondLevelDomain('*'), '*');
    assert.strictEqual(globalDoc.getSecondLevelDomain(''), '');
    assert.strictEqual(globalDoc.getSecondLevelDomain('blog.google.com'), 'google.com' );
    assert.strictEqual(globalDoc.getSecondLevelDomain('www.blog.google.com'), 'google.com');
    assert.strictEqual(globalDoc.getSecondLevelDomain('google.com'), 'google.com');
  });

  it('should check if a hash table is correctly created from the global doc', function() {
    // the items are not correct rules-objects, this is just a simplified structure
    var doc = [
      { domain: 'google.com',rules: 1 },
      { domain: 'blog.google.com', blah: 3, rules: 2 },
      { domain: 'javascripting.com', rules: 3 }
    ];

    var ht = globalDoc.createHashTable(doc);
    assert(ht['google.com'].length === 2);
    assert.deepEqual(ht['google.com'], [
      { domain: 'google.com', priority: -10, rules: 1 },
      { domain: 'blog.google.com', priority: -20, blah: 3,rules: 2 }
    ]);


    assert(ht['javascripting.com'].length === 1);
    assert.deepEqual(ht['javascripting.com'], [{domain: 'javascripting.com', priority: -10, rules:3}]);

    assert.ifError(ht['nonsense.com']);
  });

  it('should check the `appendDocument` function', function() {
    var doc1 = [{ domain: 'google.com',rules: 1 },
      {domain: 'javascripting.com', rules: 3 }
    ];

    var doc2 = [{
      domain: 'blog.google.com', blah: 3, rules: 2
    }];

    var combinedHT = {
     'google.com':
       [{ domain: 'blog.google.com', blah: 3, priority: -20, rules: 2 },
         { domain: 'google.com', rules: 1, priority: -10}
        ],

      'javascripting.com': [{ domain: 'javascripting.com', priority: -10, rules: 3 }]
    };

    globalDoc.unloadDocument();
    globalDoc.appendDocument(doc1);
    globalDoc.appendDocument(doc2);
    assert.deepEqual(globalDoc.getHashTable(), combinedHT);
  });

  it('should test if the correct document item matches given URI', function() {
    var uri = 'http://maps.google.com/mymap?du=bist',
      parsedUri = globalDoc.parseUri(uri);

    var items = [
      { domain: 'google.com', rules: 1 }, // false
      { domain: 'maps.google.com', rules: 2 }, // true
      { domain: 'maps.google.com', path: '/mymap', rules: 3}, // true
      { domain: 'maps.google.com', path: 'mymap', rules: 4}, // false, never matched, expecting '/'
      { domain: 'maps.google.com', regexp: '.*?du=bist', rules: 5}, // true
      { domain: 'maps.google.com', regexp: '.*?du=isst', rules: 6}, // false
      { domain: 'google.com', rules: 7}, // true
      { domain: 'google.com', path: '/mymap', rules: 8}, // true
      { domain: 'google.com', path: 'mymap', rules: 9}, // false
      { domain: 'google.com', regexp: '.*mymap\\?du', rules: 10}, // true
      { domain: 'google.com', regexp: '.*mymap\\?er', rules: 11}, // false
      { domain: 'mapy.seznam.cz', rules: 12}, // false
      { domain: 'foo.com', rules: 13} // false
    ];

    var resItems = _.filter(items, function(item){
      return globalDoc.isMatchingDocumentItem(item, parsedUri);
    });

    assert.deepEqual(_.pluck(resItems, 'rules'), [1, 2, 3, 5, 7, 8, 10]);
  });

  it('should check if the correct rules-object is fetched to a given URI', function() {
    var doc = [
      { domain: 'google.com', rules: 1 },
      { domain: 'maps.google.com', rules: 2 },
      { domain: 'maps.google.com', path: '/mymap', rules: 3},
      { domain: 'maps.google.com', path: 'mymap', rules: 4},
      { domain: 'maps.google.com', regexp: '.*?du=bist', rules: 5},
      { domain: 'maps.google.com', regexp: '.*?du=isst', rules: 6},
      { domain: 'google.com', rules: 7},
      { domain: 'google.com', path: '/mymap', rules: 8},
      { domain: 'google.com', path: 'mymap', rules: 9},
      { domain: 'google.com', regexp: '.*mymap\\?du', rules: 10},
      { domain: 'google.com', regexp: '.*mymap\\?er', rules: 11},
      { domain: 'mapy.seznam.cz', rules: 12},
      { domain: 'foo.com', rules: 13},
      { domain: '*', rules: 42}
    ];

    globalDoc.loadDocument(doc);

    function _eq(uri, rules) {
      assert.strictEqual(globalDoc.getRules(uri), rules);
    }

    _eq('http://google.com/', 1);
    _eq('http://foo.google.com/', 1); //unknown, matched to google.com
    _eq('http://maps.google.com/', 2);
    _eq('http://maps.google.com/mymap', 3);
    // _eq(nothing, 4)
    _eq('http://maps.google.com/buhahaha?du=bist', 5);
    _eq('http://maps.google.com/buhahaha?du=bistUndIsst', 5);
    _eq('http://mapy.seznam.cz/buhahaha?du=bistUndIsst', 12);
    _eq('http://github.cz/buhahaha?du=bistUndIsst', 42);
  });
});
