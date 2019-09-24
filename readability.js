const fs = require('fs');
const md5File = require('md5-file');
const { parseFile, writeToStream } = require('fast-csv');
const Tokenizer = require('tokenize-text');
const tokenize = new Tokenizer();
const tokenizeEnglish = require('tokenize-english')(tokenize);

function readability(filename, callback) {
    const filemd5 = md5File.sync(filename);

    fs.readFile(filename, 'utf8', (err, contents) => {
        if (err) throw err;
        const text = contents.split(/\n/).join(' ');
        const data = {
            filename: filename,
            letters: countChars(text, /[A-Za-z]/),
            numbers: countChars(text, /[0-9]/),
            words: countWords(text),
            sentences: countSentences(text),
            hash: filemd5
        };
        const cl = colemanLiau(data);
        const ari = automatedReadabilityIndex(data);
        callback({ cl, ari, ...data });
    });
}


// Returns number of characters, optionally matching a regular expression
function countChars(text, regexp) {
    const characters = tokenize.characters()(text);
    if (regexp)
        return characters.reduce((count, c) => count + regexp.test(c.value), 0);
    else
        return characters.length;
}

// Returns number of words in text
function countWords(text) {
    return tokenize.words()(text).length;
}

// Returns number of English sentences in text
function countSentences(text) {
    return tokenizeEnglish.sentences()(text).length;
}

// Computes Coleman-Liau readability index
function colemanLiau(data) {
    const { letters, words, sentences } = data;
    return ((0.0588 * (letters * 100 / words))
        - (0.296 * (sentences * 100 / words))
        - 15.8).toFixed(3);
}

// Computes Automated Readability Index
function automatedReadabilityIndex(data) {
    let { letters, numbers, words, sentences } = data;
    return ((4.71 * ((letters + numbers) / words))
        + (0.5 * (words / sentences))
        - 21.43).toFixed(3);
}

//function report(data, data2, data3) {
  //  console.log(data);
    //console.log(data2);
    /*console.log(data3);/*
    console.log(`REPORT for ${data['filename']}`);
    let chars = data['letters'] + data['numbers'];
    console.log(`${chars} characters`);
    console.log(`${data['words']} words`);
    console.log(`${data['sentences']} sentences`);
    console.log(`------------------`);
    console.log(`Coleman-Liau Score: ${data['cl']}`);
    console.log(`Automated Readability Index: ${data['ari']}\n`);*/
//}

readability(process.argv[2], data => {
    console.log(data);
    writeToStream(fs.createWriteStream('./texts.csv', {flags: 'a'}),
                  [[
                    data['filename'],
                    data['words'],
                    data['letters'] + data['numbers'],
                    data['sentences'],
                    data['cl'],
                    data['ari'],
                    data['hash']
                  ]],
                 {includeEndRowDelimiter: true})
    .on('finish', () => {
      console.log(`REPORT for ${data['filename']}`);
      let chars = data['letters'] + data['numbers'];
      console.log(`${chars} characters`);
      console.log(`${data['words']} words`);
      console.log(`${data['sentences']} sentences`);
      console.log(`------------------`);
      console.log(`Coleman-Liau Score: ${data['cl']}`);
      console.log(`Automated Readability Index: ${data['ari']}\n`);
    });
  });
