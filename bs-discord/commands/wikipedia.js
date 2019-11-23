exports.run = async (MFBGB, message, args) => {
  const Discord = require('discord.js'),
        wr = require('../../underside/webRequester.js'),
        REGEX_WIKIPEDIA = /<?https?:\/\/([\w]*)+\.(?:m\.)?wikipedia.org\/wiki\/([^?\s\t\v>]*)(?:\?.*=.*)?>?/, // URL to Wikipedia
        REGEX_NEED_ESCAPE = /[^A-Za-z0-9\-_.%!/():]/; // Characters that need escaping in URL-encoding

  /* eslint-disable one-var */
  const getPageData = (lang, pageName) => {
    return wr.fetch(MFBGB, 'https://' + lang + '.wikipedia.org/wiki/' + pageName, {})
      .then(res => {
        if (!res) return null;

        const {response, $} = res;

        if (response.statusCode >= 400) {
          return {
            error: {
              code: response.statusCode,
              message: response.statusMessage,
            },
          };
        }
        return $;
      });
  };

  const parseDablink = ($, html) => { // eslint-disable-line one-var
    let text = html;
    const regexSpan = /<span [^>]*>(.*?)<\/span>/igm;
    while (text.search(regexSpan) !== -1) {
      text = text.replace(regexSpan, '$1'); // Remove <span> surrounding text
    }

    const anchors = $('a', text);
    if (anchors.length) {
      anchors.each((i, elem) => {
        const relativeLink = $(elem).attr('href'); // eslint-disable-line no-invalid-this
        if (relativeLink.includes('redlink=1')) {
          // If the link is dead, make it normal text
          text = text.replace(
            new RegExp(`<a href="${relativeLink.replace('?', '\\?').replace('(', '\\(').replace(')', '\\)')}"[^>]*>(.*?)</a>`),
            '$1'
          );
        } else {
          // Otherwise make it absolute and URL-encode parentheses for Markdown
          text = text.replace(
            relativeLink,
            $(elem).url().replace('(', '%28').replace(')', '%29') // eslint-disable-line no-invalid-this
          );
        }
      });
    }

    text = formatHtmlToMarkdown(text)
      .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/igm, `[$2]($1)`) // Replace <a> by Markdown links
      .replace(/<ul>([\s\w\W]*)<\/ul>/igm, '$1') // Remove <ul> surrounding list
      .replace(/<li>(.*)<\/li>/igm, '・$1') // Replace <li> by normal text prefixed middle dots
      .replace(/<img [^>]*>/igm, ''); // Remove images
    return text;
  };

  const formatHtmlToMarkdown = html => html
    .replace('*', '\\*') // Escape asterisks
    .replace(/<b>(.*?)<\/b>/igm, '**$1**') // Replace <b> by markdown boldification
    .replace(/<i>(.*?)<\/i>/igm, '*$1*') // Replace <i> by markdown italicization
    .replace(/<br>/igm, ' ') // Replace line breaks by white-spaces
    .replace(/<su(p|b)>(.*?)<\/su\1>/igm, '$2') // Change superscripts and subscripts to normal
    .replace(/<small>(.*?)<\/small>/igm, '$1'); // Change small characters to normal
  /* eslint-enable one-var */

  let lang = 'ja', // Default language is Japanese
      pageName = null;

  // Check if the given string is URL to Wikipedia
  const urlRegInfo = REGEX_WIKIPEDIA.exec(args[0]);
  if (urlRegInfo) {
    lang = urlRegInfo[1] || 'ja'; // Get language from URL

    // If given URL is not escaped yet, assign the encoded URL to 'encoded' and the original to 'decoded'
    // Otherwise, assign the original to 'encoded' and the decoded to 'decoded'
    if (REGEX_NEED_ESCAPE.test(urlRegInfo[2])) {
      pageName = {encoded: encodeURIComponent(urlRegInfo[2]), decoded: urlRegInfo[2]};
    } else {
      pageName = {encoded: urlRegInfo[2], decoded: decodeURIComponent(urlRegInfo[2])};
    }
  } else {
    const name = args.join(' ');

    // See above
    if (REGEX_NEED_ESCAPE.test(name)) {
      pageName = {encoded: encodeURIComponent(name), decoded: name};
    } else {
      pageName = {encoded: name, decoded: decodeURIComponent(name)};
    }
  }

  // If the name of page is somehow something falsy, it'll be seen as invalid
  if (!pageName.encoded || !pageName.decoded) {
    message.reply('不正なページ名です');
    return;
  }

  // Indicate the bot is getting data
  await message.channel.startTyping();

  // Get page data from Wikipedia
  const pageElements = await getPageData(lang, pageName.encoded);

  if (!pageElements) {
    // If it's falsy, that means the page doesn't exist or the server is unavailable
    await message.channel.send(
      '',
      new Discord.RichEmbed()
        .setAuthor(message.member.displayName, message.author.displayAvatarURL)
        .setColor([79, 84, 92])
        .setDescription('エラー: 記事を読み込めませんでした。')
        .setTimestamp()
        .setFooter('Wikipedia Summarizer', MFBGB.BSDiscord.user.displayAvatarURL)
    );
  } else if (pageElements.error) {
    // If we have some error infomation, show it to the user
    await message.channel.send(
      '',
      new Discord.RichEmbed()
        .setAuthor(message.member.displayName, message.author.displayAvatarURL)
        .setColor([79, 84, 92])
        .setDescription('エラー: 記事を読み込めませんでした。')
        .setTimestamp()
        .setFooter('Wikipedia Summarizer', MFBGB.BSDiscord.user.displayAvatarURL)
        .addField('Code', pageElements.error.code, true)
        .addField('Message', pageElements.error.message, true)
    );
  } else {
    const $ = pageElements, // for more familiar readable jQuery-like operation
          imageURL = $('meta[property="og:image"]', 'head').attr('content'),
          source = $('#siteSub').text(),
          desc = `言語: ${lang}` + (source ? `\n${source}`: ``);
    let summary = '';

    // RegExs are expensive. This async anonymous IIFE allow the program to proceed
    await (async () => {
      // We'll use the first paragraph as description of the page

      const summaryElements = $('.mw-parser-output > p', '#mw-content-text').not('.mw-empty-elt'),
            images = $('img', summaryElements);

      // Replace <img> by alt text if they exist.
      // Note: this .each won't be called if images.length == 0
      images.each((i, elem) => {
        const e = $(elem),
              altText = `(画像${e.attr('alt') ? `:${e.attr('alt')}` : ''})`;
        e.parent().html(altText);
      });

      const summaryHTML = summaryElements.html();
      if (summaryHTML) {
        summary = summaryHTML.replace(/<sup id="cite_[^>]*>(?:.*?)<\/sup>/igm, ''); // Remove citations

        const regexNestable = /<(a|span) [^>]*>(.*?)<\/\1>/igm; // for nestable <a> & <span
        while (summary.search(regexNestable) !== -1) {
          summary = summary.replace(regexNestable, '$2'); // Remove tags surrounding text
        }

        summary = formatHtmlToMarkdown(summary);

        if (summary.length > 200) summary = summary.substring(0, 200) + '...';
      }

      summary = summary.trim();

      if (!summary) {
        // If summary is empty, we've arrived at a non-article page
        const title = $('title', 'head').text();
        if (!title.includes(' - ')) {
          summary = 'メインページ';
        }
      }
    })();

    summary = summary || '(概要はありません)';

    const embed = new Discord.RichEmbed()
      .setAuthor(message.member.displayName, message.author.displayAvatarURL)
      .setColor([0, 102, 153]) // the color of Wikimedia
      .setDescription(desc)
      .setFooter('Wikipedia Summarizer', MFBGB.BSDiscord.user.displayAvatarURL)
      .setImage(imageURL)
      .setThumbnail('https://' + lang + '.wikipedia.org/static/images/project-logos/' + lang + 'wiki.png')
      .setTimestamp()
      .setTitle(pageName.decoded)
      .setURL('https://' + lang + '.wikipedia.org/wiki/' + pageName.encoded)
      .addField('概要', summary, false);

    // Check if the page is for disambiguation
    if ($('#disambigbox').length) {
      embed.addField('曖昧さ回避', 'このページは[曖昧さ回避のためのページ](https://ja.wikipedia.org/wiki/WP:D)です');
    }

    // Check if the page has hatnotes (dablink)
    await (async () => {
      const dablinkDiv = $('.dablink, .hatnote', '#mw-content-text').not('.selfreference');

      dablinkDiv.each((i, elem) => {
        const e = $(elem);

        // In jawp, use text in the 2nd <td>
        let html = e.find('td:nth-child(2)').html();

        // In other languages, use the inside html of <div.hatnote>
        if (!html) html = e.html();

        if (html) {
          const text = parseDablink($, html),
                header = text.includes('.wiktionary.org/') ? 'ウィクショナリー' : '他の用法';
          embed.addField(header, text);
        }
      });
    })();

    // Check if the page is a stub
    await (async () => {
      const stubDiv = $('.asbox, .stub', '#mw-content-text');

      stubDiv.each((i, elem) => {
        const e = $(elem);

        // In jawp, use text up to a period in <td.mbox-text>
        let html = e.find('.mbox-text').html();

        if (html) {
          const indexPeriod = html.indexOf('。');
          if (indexPeriod) html = html.substring(0, indexPeriod + 1);
        } else {
          // In other languages, use the inside html of <i> in <div.stub>
          html = e.find('i').html();
          const indexPeriod = html.indexOf('.');

          html = indexPeriod ? `<i>${html.substring(0, indexPeriod + 1)}</i>` : `<i>${html}</i>`;
        }
        if (!html) html = e.html();

        if (html) {
          const text = parseDablink($, html),
                header = '書きかけ';
          embed.addField(header, text);
        }
      });
    })();

    await message.channel.send('', embed);
  }

  await message.channel.stopTyping();
};

exports.conf = {
  enabled: false,
  guildOnly: false,
  aliases: ['wp'],
  permLevel: 'USR',
};

exports.help = {
  name: 'wikipedia',
  category: 'MISC',
  description: 'Wikipediaの記事の概要を表示します。',
  usage: 'wikipedia <記事URL または 記事名> ',
};
