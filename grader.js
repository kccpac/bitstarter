#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var url = require("url");
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT="http://damp-brushlands-8040.herokuapp.com/";
var outfile="out.txt"
var checkFunc;
var inHtml;
var outHtml;
var out = {};

var analyze = function (outhtml, checksfile) {
    $ = outhtml;
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    var outJson = JSON.stringify(out, null, 4);
    return outJson;
}

var buildfn = function(checksfile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } 
         else {
            var outJson = analyze(cheerio.load(result), checksfile);
            console.log(outJson); 
        }
   };
    return response2console;
};
  
var checkHtmlUrl = function(htmlurl, checksfile) {
    var result = {};
    var response2console = buildfn(checksfile);
    rest.get(htmlurl).on('complete', response2console);
};


var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    checkFunc = checkHtmlFile;
    inHtml = instr; 
    return instr;
};

var assertUrlExists = function(url) {
    var str = url.toString();
    checkFunc = checkHtmlUrl;
    inHtml = str;
    return str;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    outhtml = cheerioHtmlFile(htmlfile);
    var outJson = analyze(outhtml, checksfile);
    console.log(outJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-u, --url <url>', 'url to index.html',  clone(assertUrlExists))
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists))
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .parse(process.argv);
    checkFunc(inHtml, program.checks);
    //console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
