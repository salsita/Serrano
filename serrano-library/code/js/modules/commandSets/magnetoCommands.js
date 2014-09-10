/**
 * Created by tomasnovella on 8/29/14.
 */
/**
 * This object contains commands that are magneto-specific
 * and don't deserve to belong to builtinCommands. They were basically
 * copy-pasted from the magneto sources and are not unittested.
 * Time is tight, but in the future I suggest rewriting them and hopefully
 * distilling some new useful commands.
 *
 * How to create serrano commands out of magneto commands:
 * 1. add *context* as the first argument in the functions
 * 2. replace $ with context.$
 * 3. when you call different functions that are already serrano commands,
 *   call the via this.*commandName*.code(context, *other parameters*)
 */
var magnetoCommands = {
  cleanupSel: {
    argumentCount: '1',
    code: function (context, s) {
      console.log('cleanupSel');

      if (!s || s.length === 0) {return '';}
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
  },

  parseTime: {
    argumentCount: '1',
    code: function (context, str) {
      var hour, minute;

      var matches = str.match(/([0-9]{1,2})([:\.]([0-9]{2}))?(( )?(am|pm|a|p))?/i);
      if(matches) {
        hour = parseInt(matches[1]);
        minute = parseInt(matches[3]);

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
  },
  /*
   * 1:03pm --> 13:03
   */
  convert12hTo24h: {
    argumentCount: '1',
    code: function convert12hTo24h(context, str) {
        var time = this.parseTime.code(context, str);

        return time.hour + ':' + (time.minute < 10 ? '0' : '') + time.minute;
      }
  },

  parseFacebookUntilBlock: {
    argumentCount: '2-3', // todo - maybe '3' would suffice ?
    code: function (context, start, spans, keepAsDate) {
      var fromTime, toTime;
      if(typeof spans[0] === 'string' && typeof spans[1] === 'string') {
        fromTime = spans[0];
        toTime = spans[1];
      } else {
        fromTime = context.$(spans[0]).text();
          toTime = context.$(spans[1]).text();
      }

      var parsedFrom = this.parseTime.code(context, fromTime), // todo
        parsedTo = this.parseTime.code(context, toTime); // todo

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
  },
  textLB: {
    argumentCount: '1',
    code: function(context, jqSelector) {
      var lineBreakers = ['div', 'br', 'hr', 'p'];
      var jq = context.$;

      return jq.access(this, function() {
        var clonedObj = jq('<span></span>');
        //console.log("global this");console.log(this)
        jqSelector.each(function() {

          var obj = jq(this).clone();
          var html = obj.html() || '';
          // console.log(obj);
          lineBreakers.forEach(function(tag) {
            html = html.replace(new RegExp('<' + tag  + '>', 'gi'), '\n<' + tag + '>');
            html = html.replace(new RegExp('</' + tag + '>', 'gi'), '</' + tag + '>\n');
          });

          obj.html(html);
          clonedObj.push(obj);
        });

        var returnValue = jq.fn.text.apply(clonedObj, arguments);
        // replace multiple line-breakers (3+) with only two line-breakers
        returnValue = returnValue.replace(/\n(\n+)/g, '\n\n');
        return returnValue;
      });
    }
  },
  parseEventfulDate: {
    argumentCount: '1',
    code: function(context, str) {
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

      var when = {}, startTime = false;

      /*
       * Short events
       */
      var matches = str.match(/(.*?, \d{4}) [a-zA-Z]+ (\d{1,2}:\d{2} (AM|PM))( - (\d{1,2}:\d{2} (AM|PM)))?/);
      if(matches !== null) {
        startTime = this.parseTime.code(context, matches[2]);

        when.start = matches[1] + ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0' : '') + startTime.minute;
        if(matches[6] !== undefined) {
          when.end = this.parseFacebookUntilBlock.code(context, when.start, [
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
        startTime = this.parseTime.code(context, matches[5]);
        var endTime = this.parseTime.code(context, matches[7]);

        when.start = matches[1] + ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0': '') + startTime.minute;
        when.end = matches[3] + ' ' + endTime.hour + ':' + (endTime.minute < 10 ? '0': '') + endTime.minute;
      }

      return when;

    }
  },
  parseIMDBDate: {
    argumentCount: '1',
    code: function(context, publishedDate) {
      var published = Date.parse(publishedDate || '');
      var curDay = new Date();

      curDay.set({hour: 0, minute: 0, second: 0});
      published.set({hour: 0, minute: 0, second: 0});

      if(published > curDay) {
        return {
          start: published.toString('yyyy-MM-dd'),
          end: published.toString('yyyy-MM-dd'),
          notimes: true
        };
      } else {
        return {};
      }
    }
  },
  "parsePinggTime": {
    argumentCount: '1',
    code:  function(context, str) {
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
      var startTime;
      var matches = str.match(/^(.*?), (\d{1,2}(:\d{2})?(am|pm))( - (.*?))?$/);
      if(matches !== null) {
        startTime = this.parseTime.code(context, matches[2]);

        when.start = matches[1].replace(/(\d+)(th|nd|st)/g, '$1');
        when.start += ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0' : '') + startTime.minute;

        // end time is not undefined
        if(matches[6] !== undefined) {
          when.end = this.parseFacebookUntilBlock.code(context, when.start, [
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
          startTime = this.parseTime.code(context, matches[2]);
          var endTime = this.parseTime.code(context, matches[6]);

          when.start = matches[1].replace(/(\d+)(th|nd|st)/g, '$1');
          when.end = matches[5].replace(/(\d+)(th|nd|st)/g, '$1');

          when.start += ' ' + startTime.hour + ':' + (startTime.minute < 10 ? '0' : '') + startTime.minute;
          when.end += ' ' + endTime.hour + ':' + (endTime.minute < 10 ? '0' : '') + endTime.minute;
        }
      }

      return when;
    }

  }

};


module.exports = magnetoCommands;
