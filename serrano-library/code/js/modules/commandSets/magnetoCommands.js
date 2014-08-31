/**
 * Created by tomasnovella on 8/29/14.
 */
/**
 * This object contains commands that are magneto-specific
 * and don't deserve to belong to builtinCommands. They were basically
 * copy-pasted from the magneto sources and are not unittested.
 * Time is tight, but in the future I suggest rewriting them and hopefully
 * distilling some new useful commands.
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
  }

};


module.exports = magnetoCommands;
