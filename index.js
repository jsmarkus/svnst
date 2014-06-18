#!/usr/bin/env node

var util = require('util');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var Lazy = require('lazy.js');

var SVN_EXE = 'svn';
var SVN_ARGS = ['st'];



var MAP = {
  'A': ['ok', 'Scheduled for addition'],
  'D': ['ok', 'Scheduled for deletion'],
  'M': ['ok', 'Modified items'],
  'R': ['warning', 'Items replaced in your working copy'],
  'C': ['warning', 'Conflicts'],
  'X': ['notice', 'Externals'],
  'I': ['notice', 'Ignored items'],
  '?': ['notice', 'Not under version control'],
  '!': ['warning', 'Missing items'],
  '~': ['warning', 'Type changed'],
};


var colorize = {
  notice: function(msg) {
    return chalk.gray(msg);
  },
  ok: function(msg) {
    return chalk.green(msg);
  },
  warning: function(msg) {
    return chalk.red(msg);
  },
  undef: function(msg) {
    return chalk.magenta(msg);
  }
};

function getState(line) {
  var symbol = line[0];
  return MAP[symbol] || ['undef', 'Unknown state'];
}

function isNotEmpty(line) {
  return line.length;
}

function trim(line) {
  return line.trim();
}

function main() {
  var proc = spawn(SVN_EXE, SVN_ARGS);
  var results = [];
  Lazy(proc.stdout)
    .lines()
    .map(trim)
    .filter(isNotEmpty)
    .map(function(line) {
      var state = getState(line);
      return {
        msg: line,
        state: state[0],
        description: state[1],
      };
    }).each(function(obj) {
      results.push(obj);
    });
  proc.stdout.on('end', function() {
    Lazy(results).groupBy(function(res) {
      return res.description;
    }).pairs().each(function(group) {
      util.puts('\n# ' + group[0] + ':');
      Lazy(group[1]).each(function(group) {
        console.log(colorize[group.state](group.msg));
      });
    });
  });
}

main();