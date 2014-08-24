//magneto


// for unit testing
var exports = {};

if(typeof define === "undefined") {
  define = function() { };
}
define([], function() {
  return exports;
});

// http://stackoverflow.com/a/46181/502149
var EMAIL_RE = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

(function($, _) {
  "use strict";

  (function(jq) {

    var lineBreakers = ['div', 'br', 'hr', 'p'];

    jq.fn.textLB = function() {
      return jq.access(this, function() {
        var clonedObj = jq(this).clone();
        var html = clonedObj.html() || '';

        lineBreakers.forEach(function(tag) {
          html = html.replace(new RegExp('<' + tag  + '>', 'gi'), '\n<' + tag + '>');
          html = html.replace(new RegExp('</' + tag + '>', 'gi'), '</' + tag + '>\n');
        });

        clonedObj.html(html);

        var returnValue = jq.fn.text.apply(clonedObj, arguments);
        // replace multiple line-breakers (3+) with only two line-breakers
        returnValue = returnValue.replace(/\n(\n+)/g, '\n\n');
        return returnValue;
      });
    };
  })($);

  var jQuery = $;

  function scrapePageData() {
    // begin with generic info, then patch in site-specific data
    var data = getGeneric();

    var domain = document.domain;
    var url = document.location.href;

    if (domain.indexOf('.eventbrite.') > -1) {
      data = getEventbrite(data);
    } else if (domain.indexOf('ticketmaster.com') > -1) {
      data = getTicketmaster(data);
    } else if (domain.indexOf('evite.com') > -1) {
      data = getEvite(data);
    } else if (domain.indexOf('eventful.com') > -1) {
      data = getEventful(data);
    } else if (domain.indexOf('zvents.com') > -1) {
      data = getZVents(data);
    } else if (domain.indexOf('stubhub.com') > -1 || domain.indexOf('stubhub.co.uk') > -1) {
      data = getStubHub(data);
    } else if (domain.indexOf('meetup.com') > -1) {
      data = getMeetup(data);
    } else if (domain.indexOf('designersandgeeks.com') > -1) {
      // page data same as meetup event
      date = getMeetup(data);
    } else if (domain.indexOf('pingg.com') > -1 || domain.indexOf('celebrations.com') > -1) {
      data = getPingg(data);
    } else if (domain.indexOf('yelp.com') > -1) {
      data = getYelp(data);
    } else if (domain.indexOf('foursquare.com') > -1) {
      data = getFourSquare(data);
    } else if (domain.indexOf('opentable.com') > -1) {
      data = getOpenTable(data);
    } else if (domain.indexOf('manta.com') > -1) {
      data = getManta(data);
    } else if (domain.indexOf('facebook.com') > -1) {
      data = getFacebook(data);
    } else if (domain.indexOf('linkedin.com') > -1) {
      data = getLinkedIn(data);
    } else if (domain.indexOf('imdb.com') > -1) {
      data = getIMDB(data);
    } else if (domain.indexOf('google') > -1 && domain.indexOf('mail.google.com') === -1) {
      data = getGooglePlace(data);
    } else if (domain.indexOf('mail.google.com') > -1) {
      data = getGmail(data);
      data.isMailService = true;
    } else if (domain.indexOf('tripadvisor.') > -1) {
      data = getTripAdvisor(data);
    } else if (domain.indexOf('.mail.yahoo.') > -1) {
      data = getYahooMail(data);
      data.isMailService = true;
    } else if (domain.indexOf('.salesforce.') > -1) {
      data = getSalesForce(data);
    } else if (url.indexOf('mail.live.com') > -1) {
      data = getLiveCom(data);
      data.isMailService = true;
    } else if (domain.indexOf('fandango.com') > -1) {
      data = getFandango(data);
    } else if (domain.indexOf('paperlesspost.com') > -1) {
      data = getPaperlessPost(data);
    } else {
      data = {
        what: $('h1:first').textLB()
      };
    }

    data.what = data.what || '';

    return data;
  }

  function getGeneric() {
    console.log('getGeneric');

    var obj = getOpenGraph();
    obj = scrubMicrodata(obj);
    obj = scrubMicroformat(obj);

    return obj;
  }

  function getOpenGraph() {
    console.log('getOpenGraph');
    var obj = {};
    var where = '';
    var meta = jQuery('meta');
    var url = document.domain;

    for (var i=0; i<meta.length; i++) {
      if (jQuery(meta[i]).attr('property') == 'og:title') {
        obj.title = jQuery(meta[i]).attr('content');
      }

      // skip for known site exceptions
      if (url.indexOf('zvents.com') > -1) continue;

      if (jQuery(meta[i]).attr('property') == 'og:street-address') {
        where += jQuery(meta[i]).attr('content');
      }
      if (jQuery(meta[i]).attr('property') == 'og:locality') {
        where += ' ' + jQuery(meta[i]).attr('content');
      }
      if (jQuery(meta[i]).attr('property') == 'og:region') {
        where += ' ' + jQuery(meta[i]).attr('content');
      }
      if (jQuery(meta[i]).attr('property') == 'og:postal-code') {
        where += ' ' + jQuery(meta[i]).attr('content');
      }
      /*if (jQuery(meta[i]).attr('property') == 'og:latitude') {
        obj.lat = ' ' + jQuery(meta[i]).attr('content');
      }
      if (jQuery(meta[i]).attr('property') == 'og:longitude') {
        obj.lon += ' ' + jQuery(meta[i]).attr('content');
      }*/
    }

    if (where.length > 0) {
      obj.where = where;
    }

    return obj;
  }

  function scrubMicrodata(obj) {
    //scrub for schema.org and descendants
    var nodes = [];

    jQuery('div, p').each(function() {
      if (jQuery(this).attr('itemtype') && jQuery(this).attr('itemtype').indexOf('schema.org') > -1) {
        nodes.push(this);
      }
    });
    if (nodes.length > 0) {
      for (var node in nodes) {
        try {
          var type = jQuery(nodes[node]).attr('itemtype').match('schema.org/\\s*(.*)')[1];
          var kv = parseMicrodata(type, nodes[node]);
          if (kv.length > 0) {
            if (!obj[kv[0]]) {
              obj[kv[0]] = kv[1];
            }
          }
        } catch(e) {}
      }
    }
    return obj;
  }

  function parseMicrodata(type, node) {
    console.log('parseMicrodata :: type: ' + type);
    console.log('node: ');
    console.log(node);

    var arr = [];

    switch (type) {
      case "Event":
      break;

      case "LocalBusiness":
      case "PostalAddress":
      case "Place":
      var where = '';
      jQuery(node).find('div, span, p').each(function() {
        if (jQuery(this).attr('itemprop') == 'streetAddress') {
          where += cleanupSel(jQuery(this).html());
        } else if (jQuery(this).attr('itemprop') == 'addressLocality') {
          where += ' ' + jQuery(this).textLB();
        } else if (jQuery(this).attr('itemprop') == 'addressRegion') {
          where += ', ' + jQuery(this).textLB();
        } else if (jQuery(this).attr('itemprop') == 'postalCode') {
          where += ' ' + jQuery(this).textLB();
        }

      });
      arr.push('where', where);
      break;

    }
    return arr;
  }

  function scrubMicroformat(obj) {
    // look for known vcard attributes
    if (jQuery('.vcard').length > 0) {
      var where = '';
      if (jQuery('.vcard').find('.org').length > 0) {
        where += jQuery.trim(jQuery('.vcard').find('.org').textLB());
      }
      if (jQuery('.vcard').find('.adr').length > 0) {
        where += ' ' + jQuery.trim(jQuery('.vcard').find('.adr').textLB());
      }

      if (where.length > 0 && !obj.where) {
        obj.where = where;
      }
    }
    return obj;
  }

  /******************************/
  /* TRAVEL MAGNETS (WHEN)
  /******************************/


  /******************************/
  /* PEOPLE MAGNETS (WHO)
  /******************************/
  function getLinkedIn(obj) {
    console.log('getLinkedIn');

    // if this is a personal profile page
    if (window.location.pathname.indexOf('/profile/') > -1
      || window.location.pathname.indexOf('/in/') > -1) {
      obj.what = $('.full-name').textLB();
      obj.where = '';
    } else if (window.location.pathname.indexOf('/company/') > -1) {
      var companyname = cleanupSel(jQuery('h1.name').textLB());
      obj.what = companyname.replace(/\s\|\s/g, '');

      if (jQuery('li.vcard.hq').length > 0) {
        var companyaddress = '';
        jQuery('span.street-address').each(function() {
          companyaddress += jQuery(this).textLB() + ' ';
        });
        companyaddress += jQuery('span.locality').textLB() + ' ';
        companyaddress += jQuery('abbr.region').textLB() + ' ';
        companyaddress += jQuery('span.postal-code').textLB() + ' ';
        //companyaddress += jQuery('span.country-name').textLB();
        obj.where = cleanupSel(companyaddress);
      } else {
        obj.where = '';
      }
    }

    if (jQuery('div#email-view').length > 0) {
      var emails = [];
      jQuery('div#email-view').find('a').each(function() {
        emails.push(jQuery(this).textLB());
      });
      obj.who = emails.join(', ');
    }
    var info = jQuery('div.vcard');
    if (info.length > 0) {
      //if (!obj.who) obj.who = jQuery.trim(info.find('span.full-name').textLB());
    }

    obj.notes = $('.full-name').text() + '\n' +
                $('p.title').text() + '\n\n' +
                $('.summary p.description, #profile-summary .description').textLB();

    return obj;
  }

  function parseGCalLink(link) {
    function extractArg(text, arg) {
      var regexp = new RegExp(arg + '=([^&]+)');
      var matches = text.match(regexp);
      return matches !== null ? decodeURIComponent(matches[1].replace(/\+/g, ' ')) : '';
    }

    var regexp = /^(\d\d\d\d)(\d\d)(\d\d)(T(\d\d)(\d\d)(\d\d)Z)?$/;
    function parseDate(text) {
      var datePattern = '$1-$2-$3';
      var timePattern = 'T$5:$6:$7Z';
      var pattern = datePattern;

      var matches = text.match(regexp);
      if(matches[4] !== undefined) {
        pattern += timePattern;
      }

      return text.replace(regexp, pattern);
    }

    function hasTime(text) {
      return text.match(regexp)[4] !== undefined;
    }


    var dates = extractArg(link, 'dates').split('/');
    var notimes = false;

    /*
     * 20131114T013000Z --> 2013-11-14T01:30:00Z
     */
    if(typeof dates[0] === 'string') {
      notimes = notimes || !hasTime(dates[0]);
      dates[0] = parseDate(dates[0]);
    }

    if(typeof dates[1] === 'string') {
      notimes = notimes || !hasTime(dates[1]);
      dates[1] = parseDate(dates[1]);
    }

    var data = {
      what: extractArg(link, 'text'),
      where: extractArg(link, 'location'),
      when: {
        start: dates[0],
        end: dates[1]
      }
    };

    if(notimes === true) {
      data.when.notimes = true;
    }

    return data;
  }

  function getYelp(obj) {
    console.log('getYelp');

    var link = $('.js-gcal-link').attr('href') || '';
    var isEvent = link.indexOf('http') === 0;

    /*
     *<address itemprop="address" itemscope="" itemtype="http://schema.org/PostalAddress">
        <span itemprop="streetAddress">2066 Chestnut St</span>
        <br>    (between Steiner St &amp; Mallorca Way)
        <br>
        <span itemprop="addressLocality">San Francisco</span>,
        <span itemprop="addressRegion">CA</span>
        <span itemprop="postalCode">94123</span>
        <br> Neighborhood: Marina/Cow Hollow<br>
      </address>
     */
    if(!isEvent) {
      obj.what = $('[itemprop="name"]').text();
      obj.where = $('address span').clone().append(' ').text().trim();
    } else {
      obj = _.extend(obj, parseGCalLink(link));
    }

    obj.notes = $('.event_description[itemprop="description"]').textLB();

    return obj;
  }

  function getManta(obj) {
    console.log('getManta');
    return obj;
  }

  function getOpenTable(obj) {
    console.log('getOpenTable');

    var what = '';
    var when = '';
    var where = '';

    var title = jQuery('input#txtHid_RestaurantName');
    if (title.length > 0) {
      what = title.val();
    } else {
      title = jQuery('span#ResoDetails_lblNameAddress');
      if (title.length > 0) {
        what = title.html().match(/<b>(.*)<\/b>/)[1];
      }
    }

    if(what === '') {
      what = $('#ProfileOverview_RestaurantName').text();
    }
    if (what.length > 0 && !obj.what) {
      obj.what = what;
    }

    var address = jQuery('input#txtHid_Address');
    if (address.length > 0) {
      where = address.val();
    } else {
      address = jQuery('span#ResoDetails_lblNameAddress');
      if (address.length > 0) {
        where = address.html().match(/<br>(.*)/)[1];
      }
    }
    if (where.length > 0 && !obj.where) obj.where = where;

    var date = jQuery('input#txtHid_ResDate');
    if (date.length > 0) {
      when = date.val();
    } else {
      date = jQuery('span#ResoDetails_lblDate');
      if (date.length > 0) {
        when = cleanupSel(date.html());
      }
    }

    var time = jQuery('input#txtHid_ResTime');
    if (time.length > 0) {
      when += ' ' + time.val();
    } else {
      time = jQuery('span#ResoDetails_lblTime');
      if (time.length > 0) {
        when += ' ' + cleanupSel(time.html());
      }
    }
    if (when.length > 0 && !obj.when) obj.when = when;

    return obj;
  }

  function getFourSquare(obj) {
    console.log('getFoursquare');
    obj = _.extend(obj, {
      what: $('[itemprop="name"]').text(),
      where: $('[itemprop="address"]').text().replace('➔', '').trim()
    });

    return obj;
  }


  /******************************/
  /* EVENT MAGNETS (WHAT)
  /******************************/
  function getEventbrite(obj) {
    console.log('getEventbrite');

    var info = jQuery('span.dtstart');
    if (info.length > 0) {
      obj.start = info.find('span.value-title').attr('title');
    }

    var info = jQuery('span.dtend');
    if (info.length > 0) {
      obj.end = info.find('span.value-title').attr('title');
    }

    obj.notes = $('span.description').text().trim();

    if(obj.start === undefined) {
      var info = jQuery('header time').textLB().trim();

      var matches = info.match(/\w+, (\w+ \d+, \d+) from ([0-9]+:[0-9]+ (PM|AM)) to ([0-9]+:[0-9]+ (AM|PM)) \((\w+)\)/);
      if(matches !== null) {
        obj.start = matches[1] + ' ' + matches[2] + ' ' + matches[6] + '';
        obj.end = matches[1] + ' ' + matches[4] + ' ' + matches[6] + ''
      }
    }

    if (!obj.what) {
      obj.what = jQuery('div#event_header').find('span.summary').textLB();
    }
    if (!obj.what) {
      var title = document.title.match('(.*)\\s-\\sEventbrite');
      if(title !== null) {
        obj.what = title[1];
      }
    }
    if (!obj.what) {
      obj.what = jQuery('h1.text-heading-epic').textLB();
    }

    /*
     * My Tickets
     */
    if(!obj.what) {
      obj.what = $('h2 a').text();
    }

    if(obj.where === undefined && obj.when === undefined) {
      var p = $('#manage_order p:first').text() || '';
      var matches = p
                    .trim()
                    .split('\n')
                    .map(function(str) {
                      return str.trim();
                    });
      if(matches.length === 2) {
        obj.start = matches[0];
        obj.where = matches[1];
      }
    }

    return obj;
  }

  function getTicketmaster(obj) {
    console.log('getTicketmaster');

    var info = jQuery('div.artistDetails');
    if (info.length > 0) {
      if (!obj.what) obj.what = cleanupSel(jQuery.trim(info.find('a#artist_link').textLB()));
      if (!obj.where) obj.where = cleanupSel(jQuery.trim(info.find('h2').textLB()));
      if (!obj.when) obj.when = cleanupSel(jQuery.trim(info.find('span#artist_event_date').textLB()));
    }
    // On a confirmation page
    if(!obj.what) {
      obj.what = ($('h1.header').text().match(/going to(.*)/)[1] || '').trim();
    }

    return obj;
  }

  function getStubHub(obj) {
    console.log('getStubHub');

    function parseTimezone(str) {
        return (
          str.replace(/\s(\s+)/g, ' ').match(/(a|p)\.m\. ([^\s]+)/) || []
        )[2] || '';
    }


    var timezone = parseTimezone($('.eventInfoDateTime').textLB());
    obj.when = ($('meta[property="stubhub:date"]').attr('content') || '').replace(/at (\d)/, ' $1');
    if(timezone !== '') {
      obj.when = obj.when + ' ' + timezone;
    }
    obj.where = $('meta[property="stubhub:venue"]').attr('content');
    obj.what = $('meta[property="og:title"]').attr('content');

    /*
     * Confirmation page
     */
    if(!obj.when) {
      var when = $('.cal').text() + ' ' + $('.tixDetails .boldOrangeText').text();
      obj.when = {
        start: when.trim().replace(/\s[\s]+/g, ' ') + ' ' + parseTimezone($('.tixDetails').textLB())
      };
    }

    if(!obj.what) {
      obj.what = $('.eventDescription').text().trim();
    }

    if(!obj.where) {
      obj.where = ($('.tixDetails:first').text().replace(/\n/g, ' ').match(/at(.*?)$/)[1] || '').trim();
    }

    return obj;
  }

  function parseEviteTime(when) {
    /*
     * Possible values:
     * 1) "Saturday, March 1 at 6:00 PM"
     * 2) "Saturday, September 28 from 6:00 PM to 9:00 PM"
     * 3) "Tuesday, November 12 at 6:00 PM to Wednesday, November 13 at 9:00 PM"
     * As well Evite doesn't expose the year of an event, so I assume that it's the current year.
     */
    var obj = {};

    var matches = when.match(/\w+, (\w+ \d+) (from|at) ([0-9]+:[0-9]+ (AM|PM))( to (\w+, (\w+ \d+) at )?([0-9]+:[0-9]+ (AM|PM)))?/);
    if(matches !== null) {
      var curDay = new Date();
      var curYear = curDay.getFullYear();

      var start = new Date(matches[1] + ', ' + curYear + ' ' + matches[3]);
      var occured = document.body.innerHTML.indexOf('This event has already occurred.') >= 0;

      if(!occured) {
        if(start.getDOY() < curDay.getDOY()) {
          curYear = curYear + 1;
        }
      } else {
        if(start.getDOY() > curDay.getDOY()) {
          curYear = curYear - 1;
        }
      }

      obj.start = matches[1] + ', ' + curYear + ' ' + matches[3];

      var endDay = matches[7];
      var endTime = matches[8];

      if(endTime !== undefined) {
        endDay = endDay || matches[1]; // end day = start day
      }

      if(endTime !== undefined && endDay !== undefined) {
        obj.end = endDay + ', ' + curYear + ' ' + endTime;

        var start = new Date(obj.start),
            end = new Date(obj.end);
        if(start.getDOY() > end.getDOY()) {
          if(curYear + 1 - curDay.getFullYear() > 1) {
            curYear--;
            obj.start = matches[1] + ', ' + curYear + ' ' + matches[3];
          }
          obj.end = endDay + ', ' + (curYear + 1) + ' ' + endTime;
        }
      }

    }

    return obj;
  }

  function getEvite(obj) {
    console.log('getEvite');

    var info = jQuery('div#event_details');
    if (info.length > 0) {
      obj.what = info.find('h1').textLB().trim();

      var when = '';
      when += jQuery.trim(info.find('span.dateAndTime').textLB());
      when += ' ' + jQuery.trim(info.find('span.dateAndTimeEnd').textLB());
      if (when.length > 1 && !obj.when) {
        when = parseEviteTime(when);
        obj.start = when.start;
        obj.end = when.end;
      }

      var where = '';
      where += jQuery.trim(info.find('span.locationName').textLB());
      if (info.find('span.streetAddress').length > 0) {
        if (info.find('span.streetAddress').textLB().length > 0) {
          where += ' ' + jQuery.trim(info.find('span.streetAddress').textLB());
        }
      }
      if (info.find('span.cityStateZipCountryLine').length > 0) {
        if (info.find('span.cityStateZipCountryLine').textLB().length > 0) {
          where += ' ' + jQuery.trim(info.find('span.cityStateZipCountryLine').textLB());
        }
      }
      if (where.length > 0 && !obj.where) obj.where = where;
    }

    obj.notes = $('div.message p.host_message + div').textLB();

    return obj;
  }

  function parseEventfulDate(str) {
    /*
     * "December 3, 2013 Tuesday 7:30 PM"
     * "November 26, 2013 Tuesday 8:00 PM - 10:30 PM (daily for 1000 times)"
     * "November 26, 2013 Tuesday 9:00 PM (on various days)"
     *
     * "December 6, 2013 - December 15, 2013"
     *
     * "June 17, 2013 - March 24, 2014 Monday 7:30 PM - Monday 10:30 PM"
     * "December 20, 2013 - December 21, 2013 Friday 8:00 PM - Saturday 6:00 AM"
     */

    var when = {};

    /*
     * Short events
     */
    var matches = str.match(/(.*?, \d{4}) [a-zA-Z]+ (\d{1,2}:\d{2} (AM|PM))( - (\d{1,2}:\d{2} (AM|PM)))?/);
    if(matches !== null) {
      var startTime = parseTime(matches[2]);

      when.start = matches[1] + ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0' : '') + startTime.minute;
      if(matches[6] !== undefined) {
        when.end = parseFacebookUntilBlock(when.start, [
          matches[2], // start
          matches[5]  // end
        ], true); // keep as Date

        // Date --> DoW Mon dd YYYY HH:mm
        var min = when.end.getMinutes();
        when.end = when.end.toDateString() + ' ' + when.end.getHours() + ':' + (min < 10 ? '0' : '') + min;
      }
    }

    /*
     * Multi-day events w/o times
     */
    matches = str.match(/^((.*?) \d+, \d{4}) - ((.*?) \d+, \d{4})$/);
    if(matches !== null) {
      when = {
        start: matches[1],
        end: matches[3],
        notimes: true
      };
    }

    /*
     * Multi-day events with times
     * "December 20, 2013 - December 21, 2013 Friday 8:00 PM - Saturday 6:00 AM"
     */
    matches = str.match(/^((.*?) \d+, \d{4}) - ((.*?) \d+, \d{4}) [A-Za-z]+ (\d{1,2}:\d{2} (AM|PM)) - [A-Za-z]+ (\d{1,2}:\d{2} (AM|PM))$/);
    if(matches !== null) {
      var startTime = parseTime(matches[5]);
      var endTime = parseTime(matches[7]);

      when.start = matches[1] + ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0': '') + startTime.minute;
      when.end = matches[3] + ' ' + endTime.hour + ':' + (endTime.minute < 10 ? '0': '') + endTime.minute;
    }

    return when;
  }

  function getEventful(obj) {
    console.log('getEventful');

    var info = jQuery('div.event-meta-details');
    if (info.length > 0) {
      if (info.find('.event-date').length > 0) {
        var datetime = $('.event-date').text().trim().replace(/(\n+)/g, ' ').replace(/\s+/g, ' ');
        obj.when = parseEventfulDate(datetime);
      }
    }

    obj.what = $('h1[itemprop="name"]').textLB().trim();
    obj.notes = $('.description').textLB().trim();

    return obj;
  }

  function parseZventsTime(str) {
    var hourMinRegExp = /(\d{1,2}:\d{2}(a|p))/;
    var hourMinRegExpStrict = /^(\d{1,2}:\d{2}(a|p))$/;

    function isTime(_str) {
      return _str.match(hourMinRegExpStrict) !== null;
    }

    function hasDate(_str) {
      return !isTime(_str);
    }

    function getTime(_str) {
      return (_str.match(hourMinRegExp) || [])[1];
    }

    function hasYear(_str) {
      return _str.match(/\d{1,2},? (\d{4})/) !== null;
    }

    function fixYear(_str) {
      return _str.replace(/^([a-zA-Z]+,? [A-Za-z]+ \d{1,2})/, '$1 ' + (new Date()).getFullYear());
    }


    var when = {};
    var matches;

    var today = (new Date()).toDateString();
    str = str.replace(/^today/i, today);

    var parts = str.split('to').map(function(part) {
      return part.trim();
    });
    var start = parts[0];
    var end = parts[1];

    if(start === undefined) {
      return when;
    }

    if(!hasYear(start)) {
      start = fixYear(start);
    }
    var startTime = getTime(start);
    if(startTime === undefined) {
      when.start = start;
      when.notimes = true;
    } else {
      startTime = convert12hTo24h(startTime);
      when.start = start.replace(hourMinRegExp, startTime);
    }

    if(end === undefined) {
      if(when.notimes === true) {
        when.end = when.start;
      }
      return when;
    }

    if(hasDate(end)) {
      if(!hasYear(end)) {
        end = fixYear(end);
      }

      var endTime = getTime(end);
      if(endTime === undefined) {
        when.end = end;
        when.notimes = true;
      } else {
        endTime = convert12hTo24h(endTime);
        when.end = end.replace(hourMinRegExp, endTime);
      }
    } else {
      when.end = parseFacebookUntilBlock(when.start, [
                   startTime,
                   end
                 ], true); //keep as Date
     var endMinutes = when.end.getMinutes();
      when.end = when.end.toDateString() + ' ' + when.end.getHours() + ':' + (endMinutes < 10 ? '0': '') + endMinutes;
    }


    return when;
  }

  function getZVents(obj) {
    console.log('getZVents');

    obj.what = $('h1.name span').text();

    if (jQuery('div.date').length > 0) {
      obj.when = $('.date abbr:first').text().replace(/\n/g, ' ').replace(/\s(\s+)/, ' ').trim();
      obj.when = parseZventsTime(obj.when);
    }
    console.log(obj.when);

    if (jQuery('div.venue').length > 0) {
      var venue = jQuery('div.venue a').textLB();
    }

    var node = jQuery('div.address');
    var kv = parseMicrodata('PostalAddress', node);
    if (kv.length > 0) {
      if (!obj[kv[0]]) {
        obj[kv[0]] = kv[1];
      }
    }

    node = jQuery('div#event_map_address');
    if (node.length > 0) {
      var where = '';
      if (venue) where += venue + ' ';
      where += node.find('span.street-address').textLB();
      where += ' ' + node.find('span.locality').textLB();
      where += ' ' + node.find('span.region').textLB();
      where += ' ' + node.find('span.postal-code').textLB();
      if (where.length > 0) obj.where = where;
    }

    if(obj.when && typeof obj.when === 'string') {
      // Wednesday, Dec 19, 2012 5:00p to 6:00p
      var matches = obj.when.match(/(.*?) (\d{1,2}:\d{1,2}(a|p)) to (.*)/);
      if(matches !== null) {
        obj.when = {
          start: matches[1] + ' ' + matches[2],
          end: matches[1] + ' ' + matches[4]
        };
      }
    }

    obj.notes = $('div.description').textLB();

    return obj;
  }

  function getMeetup(obj) {
    console.log('getMeetup');

    obj.what = $('h1[itemprop]').text();
    if (jQuery('div#event-when-display').length > 0) {
      var when = '';
      if (jQuery('time#event-start-time').length > 0) {
        when += jQuery('time#event-start-time p.headline').textLB();
        when += ' ' + jQuery('time#event-start-time p.subtext').textLB();
        //when += jQuery('time#event-end-time').textLB();
      } else if (jQuery('time').length > 0) {
        when += jQuery('time p.headline').textLB();
        when += ' ' + jQuery('time p.subtext').textLB();
      }
      obj.when = when;

      var matches = when.match(/(.*?) (\d{1,2}:\d{1,2} (AM|PM)) to (.*)/);
      if(matches !== null) {
        var start = matches[1] + ' ' + matches[2];
        var end = parseFacebookUntilBlock(start, [
          matches[2],
          matches[4]
        ]);
        obj.when = {
          start: start,
          end: end
        };
      }
    }

    if (jQuery('div#event-where-display').length > 0) {
      var where = '';
      if (jQuery('div#event-where-display p.headline').length > 0) {
        where += jQuery('div#event-where-display p.headline').textLB();
      }
      if (jQuery('p.event-where-address').length > 0) {
        if (where.length > 0) where += ', ';
        where += jQuery('p.event-where-address').textLB();
      }

      var cleanwhere = cleanupSel(where);
      obj.where = cleanupSel(cleanwhere.replace('(map)', '').replace('|', ''));
    }

    obj.notes = $('[itemprop="description"]').textLB();

    return obj;
  }

  function parsePinggTime(str) {
    var when = {};

    /*
     * Cases:
     *
     * 1) short event with only timestamp @ http://www.celebrations.com/rsvp/x62578c6zatqzdyae
     *    December 30th, 2013, 9:15am
     *
     * 2) short event within one day @ http://www.celebrations.com/rsvp/iy7qmxge3jb8k85h8
     *    December 30th, 2013, 8:15pm - 11:15pm
     *
     * 3) event which covers two days @ http://www.celebrations.com/rsvp/8b525km5j3f8668pk
     *    December 30th, 2013, 9:30pm - 4:30am
     *
     * 4) multi-day event @ http://www.celebrations.com/rsvp/db4kc5b4qdbkm52qb
     *    December 30th, 2013 @ 9:30pm to December 31st, 2013 @ 12:30pm
     */

    /*
     * short event
     */
    var matches = str.match(/^(.*?), (\d{1,2}(:\d{2})?(am|pm))( - (.*?))?$/);
    if(matches !== null) {
      var startTime = parseTime(matches[2]);

      when.start = matches[1].replace(/(\d+)(th|nd|st)/g, '$1');
      when.start += ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0' : '') + startTime.minute;

      // end time is not undefined
      if(matches[6] !== undefined) {
        when.end = parseFacebookUntilBlock(when.start, [
          matches[2],
          matches[6]
        ], true); // keep as Date

        // Date --> DoW Mon dd YYYY HH:mm
        var min = when.end.getMinutes();
        when.end = when.end.toDateString() + ' ' + when.end.getHours() + ':' + (min < 10 ? '0' : '') + min;
      }
    } else {

      /*
       * multi-day event
       * December 30th, 2013 @ 9:30pm to December 31st, 2013 @ 12:30pm
       */
      matches = str.match(/^(.*?) @ (\d{1,2}(:\d{1,2})?(am|pm)) to (.*?) @ (\d{1,2}(:\d{2})?(am|pm))$/);
      if(matches !== null) {
        var startTime = parseTime(matches[2]);
        var endTime = parseTime(matches[6]);

        when.start = matches[1].replace(/(\d+)(th|nd|st)/g, '$1');
        when.end = matches[5].replace(/(\d+)(th|nd|st)/g, '$1');

        when.start += ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0' : '') + startTime.minute;
        when.end += ' ' + endTime.hour + ':' + (endTime.minute < 10 ? '0' : '') + endTime.minute;
      }
    }

    return when;
  }

  /*
   * Ping.com is dead, long live Celebrations.com
   */
  function getPingg(obj) {
    console.log('getPingg');

    var node = jQuery('div#details');
    if (node.length > 0) {
      node.find('tr').each(function() {
        var th = $(this).find('th').textLB().toLowerCase();
        if (th.indexOf('what') > -1) {
          obj.what = cleanupSel($(this).find('td').html());
        }
        if (th.indexOf('where') > -1) {
          obj.where = cleanupSel($(this).find('td').html());
        }
        if (th.indexOf('when') > -1) {
          obj.when = cleanupSel($(this).find('td').html());
        }
      });
    }

    if(obj.when && typeof obj.when === 'string') {
      obj.when = parsePinggTime(obj.when);
    }

    obj.notes = $('.more_info_container').textLB();

    return obj;
  }


  /******************************/
  /* HELPER FUNCTIONS
  /******************************/
  function cleanupSel(s) {
    console.log('cleanupSel');

    if (!s || s.length == 0) return '';
    // remove whitespace
    //s = jQuery.trim(s);

    // strip out img tags
    s = s.replace(/<img[^>]+>/g,'\n');
    // remove tabs
    s = s.replace(/\t/g,'');
    // replace newline with pipe
    //s = s.replace(/\n/g,' | ');
    // replace newline with space
    s = s.replace(/\n/g,' ');
    // replace linebreak with space
    s = s.replace(/<br>/g,' ');
    s = s.replace(/<br\/>/g,' ');
    // strip out formatting tags
    s = s.replace(/<[^>]+>/g,'');
    // replace multiple spaces with single space
    s = s.replace(/\s{2,}/g, ' ');

    return s;
  }

  function getPageInfo() {
    return '?url=' + encodeURIComponent(window.location.href) + '&_r='+(Math.random());
  }

  function parseTime(str) {
    var hour, minute;

    var matches = str.match(/([0-9]{1,2})([:\.]([0-9]{2}))?(( )?(am|pm|a|p))?/i);
    if(matches) {
      var hour = parseInt(matches[1]), minute = parseInt(matches[3]);

      if(isNaN(minute)) {
        minute = 0;
      }

      var isAfternoon = matches[6] !== undefined &&
                        (matches[6].toLowerCase().trim() === 'pm' ||
                        matches[6].toLowerCase().trim() === 'p');
      if(isAfternoon) {
        if(hour < 12) {
          hour += 12;
        }
      } else {
        if(hour === 12) {
          hour = 0;
        }
      }
    }

    return {
      hour: hour,
      minute: minute
    };
  }

  /*
   * 1:03pm --> 13:03
   */
  function convert12hTo24h(str) {
    var time = parseTime(str);

    return time.hour + ':' + (time.minute < 10 ? '0' : '') + time.minute;
  }

  function parseFacebookUntilBlock(start, spans, keepAsDate) {
    var fromTime, toTime;
    if(typeof spans[0] === 'string' && typeof spans[1] === 'string') {
      fromTime = spans[0];
      toTime = spans[1];
    } else {
      fromTime = $(spans[0]).text(),
      toTime = $(spans[1]).text();
    }

    var parsedFrom = parseTime(fromTime),
        parsedTo = parseTime(toTime);

    var fromHour = parsedFrom.hour,
        fromMin = parsedFrom.minute,
        toHour = parsedTo.hour,
        toMin = parsedTo.minute;

    var end;
    if(fromHour !== undefined && toHour !== undefined) {
      if(toHour < fromHour) {
        toHour += 24;
      }

      var length = ((toHour - fromHour) * 3600 + (toMin - fromMin) * 60) * 1000;

      try {
        var startDate = new Date(start);
        end = new Date(startDate.getTime() + length);
        if(keepAsDate !== true) {
          end = end.toISOString();
        }
      } catch(e) {
        console.log(e);
      }
    }

    return end;
  }

  function getFacebook(data) {
    var notimes = false;

    // "2013-10-31T00:00:00-07:00"
    var start = $('[itemProp="startDate"]').attr('content');
    if(start === '') {
      start = $('img[title="Time"]').parents(':eq(1)').textLB();
    }

    var end = $('[itemProp="endDate"]').attr('content');
    var spans = $('#contentCol span.fcb');
    var onlyStartTimestamp = $('li.fbEventTimeWeatherInfoSection span').length === 1 && //<timestamp> in <timeozone>
                             $('#contentCol span.fcb').length === 0 && // there is no string from ... until...
                             $('li.fbEventTimeWeatherInfoSection div.fsl').length === 0; // <timestamp> w/o <timezone>

     /*
     * In this case Facebooks might show something "8:00pm until 4:00am in UTC+02". If you hover the mouse on
     * one of those timestamps, you can see something like "11:00am in your time". So here I try to parse titles and
     * extract hours for start and end. Since I'm not going to complicate the code base for calculating time zones, I want to
     * calculate the length of the event and compute the end date time as: (start timestamp) + (the length of the event in hours).
     *
     * The problem with 12h time format is that its writing in diffirent locales are different.
     */

    var untilBlockThere = spans.length === 2;
    if(end === undefined && untilBlockThere) {
      end = parseFacebookUntilBlock(start, spans);
    }

    if(onlyStartTimestamp === true) {
      if(end !== undefined) {
        console.error("End should be undefined if there is only start timestamp");
      }

      var startDate = new Date(start);
      start = $('[itemprop="startDate"]').text();
      end = start;
      notimes = true;
    }

    return _.extend(data, {
      what: $('.fbEventHeadline').html() || $('a[href*="/events/"]:first').textLB(),
      when: {
        start: start,
        end: end,
        notimes: notimes
      },
      where: $('span.visible:first').textLB() || $('span[itemprop="location"]').textLB(),
      notes: $('span[itemprop="description"]').textLB() || $('[id="pagelet_event_details"]').textLB(),
      who: ''
    });
  }

  function parseIMDBDate(publishedDate) {
    var published = Date.parse(publishedDate || '');
    var curDay = new Date();

    curDay.set({hour: 0, minute: 0, second: 0});
    published.set({hour: 0, minute: 0, second: 0});

    if(published > curDay) {
     return {
       start: published.toString('yyyy-MM-dd'),
       end: published.toString('yyyy-MM-dd'),
       notimes: true
     }
    } else {
     return {}
    };
  }

  function getIMDB(data) {
    var notes =
          'Stars:\n' +
          $('[itemprop="actors"] span[itemprop="name"]').
          map(function(index, el) {
            return $(el).textLB()
          }).
          toArray().
          join(', ') +
          '\n\n' +
          $('p[itemprop="description"]').textLB().trim();
    var when = parseIMDBDate($('.infobar [itemprop="datePublished"]').attr('content'));

    return _.extend(data, {
      what: 'In theatres: ' + $('h1.header span[itemprop="name"]').text(),
      when: when,
      where: '',
      notes: notes,
      who: ''
    });
  }

  function getGooglePlace(data) {
    var where = $('span:contains("Address") + span').textLB();

    var metadataTextnodes = $('#rhs_block .kno-f').find(":not(iframe)").contents().filter(function() {
      return this.nodeType === 3 && this.nodeText !== '';
    });
    var metadata = metadataTextnodes.toArray().map(function(piece) {
      return $(piece).textLB().replace(':', ': ').trim();
    });
    metadata = metadata.join('\n').replace(/[\n]+/g, '\n').trim();

    return _.extend(data, {
      what: $('#rhs_block .kno-ecr-pt').textLB(),
      when: '',
      where: where,
      notes: metadata,
      who: ''
    });
  }

  function getGmail(data) {
    var who = $('form[method="POST"]:last [email]').
          map(function(index, el) {
            return $(el).attr('email');
          }).
          toArray();

    $('form[method="POST"]:last div').each(function(index, el) {
      if(EMAIL_RE.test($(el).textLB()) && $(el).children().length === 0) {
        who.push($(el).textLB());
      }
    });

    $('span[email]:visible').each(function(index, el) {
      who.push($(el).attr('email'));
    });
    who = who.sort().filter(function(el, index, arr){
      return index === arr.indexOf(el);
    });

    // h2:last was added on 17/2/2014
    var what = $('input[name="subjectbox"]:last').val() || $('h1[role!="banner"]:first,h2:last span:first').textLB();
    what = what.replace(/fwd\:\s?/ig, '').
            replace(/re\:\s?/ig, '').
            replace(/Invitation\:\s?/, '');

    if(what === '') {
      who = '';
    }

    return _.extend(data, {
      who: who.join(", "),
      what: what,
      where: '',
      when: '',
      notes: $('[contenteditable]:last').textLB() || $('div[id*=":"][style*="overflow"][style*="hidden"]:visible:last').textLB()
    });
  }

  function getTripAdvisor(data) {

    return _.extend(data, {
      source: document.location.href,
      what: $('h1:first').textLB(),
      where: $('address').textLB().trim().replace(/\n/g, '')
    });
  }

  function extractEmail(email) {
    var matches = email.match(/<([^@]+@[^@]+)>/, email);
    if(matches !== null) {
      return matches[1];
    }

    return email;

  }

  function getYahooMail(data) {
    var what = '', who = [], notes = '';
    var isNewMode = $('#msg-list').length > 0;
    var isConversations = $('.threadpane').length > 0;

    /*
     * Selector which returns the visible pane in Yahoo UI. There is only reliable technique to figure out whether
     * a pane is visible. Its width should be greather than 1px. To strength the stability in the case of subtle possible changes
     * I assume that the width of a pane should be greater than 100px. It's safe since the minimal width of the pane is about 600px;
     *
     * https://github.com/jquery/sizzle/wiki/Sizzle-Documentation#note-that-in-jquery-18-the-old-api-for-creating-custom-pseudos-with-arguments-was-broken-but-in-jquery-181-the-api-is-backwards-compatible-regardless-the-use-of-createpseudo-is-greatly-encouraged
     */
    $.expr[':'].currentPane = function(obj) {
      return $(obj).width() >= 100;
    };

    var notesBlock;
    if(isNewMode) {
      var classSelector = isConversations ? '.threadpane' : '.messagepane';
      if(isConversations) {
        what = $('.threadpane:currentPane .thread-subject').text();
        notesBlock = $('.threadpane:currentPane .thread-body:last');
      } else {
        what = $('.messagepane:currentPane .subject').text();
        notesBlock = $('.messagepane:currentPane .msg-body');
      }

      /*
       * That's necessary since Yahoo UI shortens a list of emails if there are more that, say, 4.
       * To show all the list the user needs click on "<some number>" More button
       */
      $(classSelector + ' [data-action="more"]').click();
      who = $(classSelector + ':currentPane [data-address]')
              .toArray()
              .map(function(email) {
                return $(email).attr('data-address');
              });

    } else {
      what = $('.subjectbar h1').text();
      notesBlock = $('.mailContent');
      who = $('dd.emailids span')
              .toArray()
              .map(function(span) {
                return $(span).text();
              });
    }

    notesBlock = notesBlock.clone();
    notesBlock.find('style').remove();
    notes = notesBlock.textLB();

    who = who
      .map(function(email) {
        return extractEmail(email);
      })
      .sort()
      .filter(function(el, index, arr){
        // removing duplicates
        return index === arr.indexOf(el);
      });
    who = who.join(',');

    notes = notes.replace(/\n(\n)+/g, '\n');
    what = what.replace(/fwd\:\s?/ig, '').
            replace(/re\:\s?/ig, '').
            replace(/Invitation\:\s?/, '');


    return _.extend(data, {
      what: what,
      who: who,
      notes: notes
    });
  }

  function getSalesForce(data) {
    if($('[title="Contacts Tab - Selected"]').length === 0) {
      return data;
    }

    var what = $('.topName').textLB().trim();
    var who = $('a[href*="@"][href*="mailto:"]').textLB();

    var mailingAddress = '',
        billingAdress = '',
        shippingAddress = '';
    mailingAddress = $('.pbSubsection:nth(1) div').textLB().replace(/\n/g, ' ').trim();
    if(mailingAddress === '') {
      var accountUrl = $('td.labelCol:contains("Account"):first + td a').attr('href');
      var text = $.ajax({
        url: accountUrl,
        async: false,
        dataType: 'text'
      }).responseText;

      billingAdress = (text.match(/Billing Address<\/td><td([.\S\s]*?)><div([.\S\s]*?)>([.\S\s]*?)<\/div>/)[3] || '').replace(/\n/g,  ' ').trim();
      shippingAddress = (text.match(/Shipping Address<\/td><td([.\S\s]*?)><div([.\S\s]*?)>([.\S\s]*?)<\/div>/)[3] || '').replace(/\n/g,  ' ').trim();
    }

    var where = '';
    if(mailingAddress !== '') {
      where = mailingAddress;
    } else if(shippingAddress !== '') {
      where = shippingAddress;
    } else if (billingAdress !== '') {
      where = billingAdress;
    }
    where = where.replace(/<br\/?>/g, ' ').trim();

    var notes = [
      'Title: ',
      $('td.labelCol:contains("Title") + td').textLB(),
      '\n',
      'Phone: ',
      $('td.labelCol:contains("Phone") + td').textLB(),
      '\n',
      'Mobile: ',
      $('td.labelCol:contains("Mobile") + td').textLB(),
      '\n',
      'Department: ',
      $('td.labelCol:contains("Department") + td').textLB(),
      '\n',
      'Last Stay-in-touch Save Date: ',
      $('td.labelCol:contains("Stay-in-touch") + td').textLB(),
      '\n',
      'Fax: ',
      $('td.labelCol:contains("Fax") + td').textLB(),
      '\n'
    ].join('');

    notes = notes.replace(/\n(\n)+/g, '\n');

    // Extract an address
    return _.extend(data, {
      what: what,
      who: who,
      where: where,
      notes: notes
    });
  }

  function getLiveCom(data) {
    // reading pane is hidden
    if($('.ReadingPaneSplitPaneHidden').length > 0) {
      return data;
    }

    var what = $('#readingPaneSplitPane').find('.ReadMsgSubject').text();
    what = what.replace(/fwd?\:\s?/ig, '').
        replace(/re\:\s?/ig, '').
        replace(/Invitation\:\s?/, '');

    /*
     * Extract recipients
     */

    // from service attributes
    var who = [];
    $('#readingPaneSplitPane').find('.HasLayout').each(function() {
      $.each(this.attributes, function() {
        var attr = this;
        if(!attr.specified || attr.value.indexOf('@') === -1) {
          return;
        }

        var mails = attr.value.split(';');
        mails.forEach(function(mail) {
          if(mail.indexOf('@') >= 0) {
            mail = extractEmail(mail);
            who.push(mail.trim());
          }
        });
      });
    });

    /*
     * There are two places where "To:" recipients are listed.
     *
     * the first one is in the short info block
     */
    $('#readingPaneSplitPane').find('.recip_to').each(function() {
      $(this).text()
        .replace(/,/g, '')
        .split(/[ \t\r\n\v\f]/)
        .filter(function(mail) {
          return mail.indexOf('@') >= 0;
        })
        .forEach(function(mail) {
          who.push(mail.trim());
        })
    });


    // the second one is in the
    $('#readingPaneSplitPane').find('td.ReadMsgHeaderCol1:contains("To") + td').each(function() {
      var matches = $(this)
                    .text()
                    .match(/\((.*?)\)/g) || [];
        matches.forEach(function(mail) {
          mail = mail.replace(')', '').replace('(', '');
          who.push(mail.trim());
        });
    });

    // normalize(sort, remove dupes, join with comma)
    who = who
          .sort()
          .filter(function(el, index, arr){
            // remove dupes
            return index === arr.indexOf(el);
          })
          .join(',');

    var notes = $('#readingPaneSplitPane').find('.SandboxScopeClass').clone();
    notes.find('style').remove();

    return _.extend(data, {
      what: what,
      who: who,
      notes: notes.textLB()
    });
  }

  function getFandango(data) {
    var what = $('.movieTitle').text() || $('#GlobalBody_HeaderTitleControl').text();
    var when = ($('.showDate').text() + ' ' + $('.showTime').text().replace('Showtime: ', '')).replace(/\s\s+/g, ' ');
    var where = $('.address a').textLB();
    var notes = $('#moviepage-details').textLB();

    return _.extend(data, {
      what: what,
      when: when,
      where: where,
      notes: notes
    });
  }

  function getPaperlessPost(data) {
    var link = $('a[href*="/messages"]').attr('href');
    data = _.extend(data, parseGCalLink($('a[href*="google.com/calendar"]').attr('href')));

    if(link !== undefined) {
      var text = $.ajax({
        type: 'GET',
        url: link,
        async: false,
        dataType: 'text'
      }).responseText.replace(/\n/g, '');

      var matches = text.match(/<div class=["']full-text['"]><p>(.*?)<\/p><\/div>/);
      if(matches !== null) {
        data.notes = matches[1];
      }
    }

    return data;
  }

  function getSelText() {
    var s = '';

    if (window.getSelection) {
      s = window.getSelection();
    } else if (document.getSelection) {
      s = document.getSelection();
    } else if (document.selection) {
      s = document.selection.createRange().text;
    }

    return s;
  }

  function unescapeSpecialChars(str) {
    return str
            .replace(/&amp;/g, '&')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00a0/g, ' ') //whitespace
            .replace(/<!--.*?-->/g, '');
  }

  function scrape() {
    var data;

    try {
      data = scrapePageData();
    } catch(e) {
      console.log(e);
      data = {};
    }

    var selection = getSelText();
    var address = parent !== window ? document.referrer : document.location.href;

    // selected text has a higher priority in mail services
    if(data.isMailService) {
      data.notes = cleanupSel(selection.toString()) || data.notes;
    } else {
      data.notes = data.notes || cleanupSel(selection.toString());
    }

    data.notes += '\nSource:\n' + address;

    data.where = unescapeSpecialChars(data.where || '');
    data.notes = unescapeSpecialChars(data.notes || '');
    data.who = unescapeSpecialChars(data.who || '');

    // it's necessary to delete WHAT field, otherwise the Magneto backend
    // successfully saves a magneto (a calender entry) with WHAT field as an empty string
    if(data.what !== undefined && data.what.match(/^\s*$/) !== null) {
      delete data.what;
    }

    if(typeof data.what === 'string') {
      data.what = data.what.trim();
    }

    return data;
  }

  exports = {
    parseTime: parseTime,
    getFacebook: getFacebook,
    getEventful: getEventful,
    parseFacebookUntilBlock: parseFacebookUntilBlock,
    parseEviteTime: parseEviteTime,
    parseIMDBDate: parseIMDBDate,
    parseGCalLink: parseGCalLink,
    parsePinggTime: parsePinggTime,
    parseEventfulDate: parseEventfulDate,
    parseZventsTime: parseZventsTime
  };

  return scrape();
})($, _);
