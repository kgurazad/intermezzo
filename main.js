var { JSDOM } = require ('jsdom');
var dom = new JSDOM(`<!doctype html>
	<html>
		<head>
			<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
		</head>
		<body>
		</body>
	</html>`);
var window = dom.window;
var document = dom.window.document;
global.window = window;
global.document = document;
var $ = global.jQuery = require('jquery');
var fs = require('fs');
var formatter = require('html-formatter');

function Game (round, teamStatlines, winnerTeam, loserTeam) {
	this.round = round;
  this.teamStatlines = teamStatlines;
  this.winnerTeam = winnerTeam;
  this.loserTeam = loserTeam;
  winnerTeam.games.push(this);
  loserTeam.games.push(this);
  for (var playerName of winnerTeam.playerNames) {
  	if (this.teamStatlines[winnerTeam.name].playerStatlines[playerName] != null) {
  		players[playerName].games.push(this);
    }
  }
  for (playerName of loserTeam.playerNames) {
  	if (this.teamStatlines[loserTeam.name].playerStatlines[playerName] != null) {
  		players[playerName].games.push(this);
    }
  }
  this.opponentName = function (teamName) {
  	if (winnerTeam.name === teamName) {
    	return loserTeam.name;
    }
    return winnerTeam.name;
  }
  this.result = function (teamName) {
  	if (winnerTeam.name === teamName) {
    	return 'Win';
    }
    return 'Loss';
  }
}

function TeamStatline (team, playerStatlines, points, tuh, bh) {
	this.team = team;
	this.tuh = tuh;
  this.playerStatlines = playerStatlines;
  this.powers = 0;
  this.gets = 0;
  this.negs = 0;
  for (var playerName of team.playerNames) {
    var playerStatline = playerStatlines[playerName];
    if (playerStatline == null) {
    	console.log('no statline for ' + playerName + ' :onocrab:');
      continue;
    }
  	this.powers += playerStatline.powers;
    this.gets += playerStatline.gets;
    this.negs += playerStatline.negs;
  }
  this.points = 15*this.powers + 10*this.gets - 5*this.negs;
  this.bh = bh;
  this.bonusPoints = points - this.points;
  this.points = points;
}

function PlayerStatline (player, powers, gets, negs, tuh) {
	this.player = player;
  this.tuh = tuh;
  this.powers = powers;
  this.gets = gets;
  this.negs = negs;
  this.points = 15*this.powers + 10*this.gets - 5*this.negs;
}

function Team (name, playerNames, bracket) {
	this.name = name;
  this.playerNames = playerNames;
  this.bracket = bracket;
  this.games = [];
  this.wins = function () {
  	var wins = 0;
  	for (var game of this.games) {
    	if (game.winnerTeam === this) {
      	wins++;
      }
    }
    return wins;
  }
  this.losses = function () {
  	var losses = 0;
  	for (var game of this.games) {
    	if (game.loserTeam === this) {
      	losses++;
      }
    }
    return losses;
  }
  this.wpct = function () {
  	var w = this.wins();
    var l = this.losses();
    return Math.round(100*w/(w+l));
  }
  this.points = function () {
  	var pts = 0;
    for (var game of this.games) {
    	pts += game.teamStatlines[this.name].points;
    }
    return pts;
  }
  this.ppg = function () {
    return Math.round(100*this.points()/this.games.length)/100;
  }
  this.opponentPoints = function () {
  	var pts = 0;
    for (var game of this.games) {
    	if (game.winnerTeam === this) {
      	pts += game.teamStatlines[game.loserTeam.name].points;
      } else {
      	pts += game.teamStatlines[game.winnerTeam.name].points;
      }
    }
    return pts;
  }
  this.papg = function () {
    return Math.round(100*this.opponentPoints()/this.games.length)/100;
  }
  this.mrg = function () {
  	return this.ppg() - this.papg();
  }
  this.powers = function () {
  	var powers = 0;
    for (var game of this.games) {
    	powers += game.teamStatlines[this.name].powers;
    }
    return powers;
  }
  this.gets = function () {
  	var gets = 0;
    for (var game of this.games) {
    	gets += game.teamStatlines[this.name].gets;
    }
    return gets;
  }
  this.negs = function () {
  	var negs = 0;
    for (var game of this.games) {
    	negs += game.teamStatlines[this.name].negs;
    }
    return negs;
  }
  this.tuh = function () {
  	var tuh = 0;
    for (var game of this.games) {
    	tuh += game.teamStatlines[this.name].tuh;
    }
    return tuh;
  }
  this.ppth = function () {
  	return Math.round(this.ppg()*this.games.length*100/this.tuh())/100;
  }
  this.pn = function () {
  	return Math.round(100*this.powers()/this.negs())/100;
  }
  this.bh = function () {
  	var bh = 0;
    for (var game of this.games) {
    	bh += game.teamStatlines[this.name].bh;
    }
    return bh;
  }
  this.bpts = function () {
  	var pts = 0;
    for (var game of this.games) {
    	pts += game.teamStatlines[this.name].bonusPoints;
    }
    return pts;
  }
  this.ppb = function () {
  	return Math.round(100*this.bpts()/this.bh())/100;
  }
}

function Player (name, teamName) {
	this.name = name;
  this.teamName = teamName;
  this.games = [];
  this.gp = function () {
  	var gp = 0;
		for (var game of this.games) {
			gp += Math.round(100*game.teamStatlines[this.teamName].playerStatlines[this.name].tuh/stdGameLength)/100;
		}
		return gp;
  }
  this.powers = function () {
  	var num = 0;
    for (var game of this.games) {
    	num += game.teamStatlines[this.teamName].playerStatlines[this.name].powers;
    }
    return num;
  }
  this.gets = function () {
  	var num = 0;
    for (var game of this.games) {
    	num += game.teamStatlines[this.teamName].playerStatlines[this.name].gets;
    }
    return num;
  }
  this.negs = function () {
  	var num = 0;
    for (var game of this.games) {
    	num += game.teamStatlines[this.teamName].playerStatlines[this.name].negs;
    }
    return num;
  }
  this.tuh = function () {
  	var num = 0;
    for (var game of this.games) {
    	num += game.teamStatlines[this.teamName].playerStatlines[this.name].tuh;
    }
    return num;
  }
  this.points = function () {
  	var num = 0;
    for (var game of this.games) {
    	num += game.teamStatlines[this.teamName].playerStatlines[this.name].powers*15 + game.teamStatlines[this.teamName].playerStatlines[this.name].gets*10 - game.teamStatlines[this.teamName].playerStatlines[this.name].negs*5;
    }
    return num;
  }
  this.ppth = function () {
  	return Math.round(100*this.points()/this.tuh())/100;
  }
  this.pn = function () {
  	return Math.round(100*this.powers()/this.negs())/100;
  }
  this.ppg = function () {
  	return Math.round(100*this.points()/this.gp())/100;
  }
}

var teams = {};
var players = {};
var games = [];
var stdGameLength = 20;
var reportName = 'intermezzo';
var tableStyle = `
<table border=0 width=100%>
<tr>
  <td><A HREF="` + reportName + `_standings.html">Standings</A></td>
  <td><A HREF="` + reportName + `_individuals.html">Individuals</A></td>
  <td><A HREF="` + reportName + `_games.html">Scoreboard</A></td>
  <td><A HREF="` + reportName + `_teamdetail.html">Team Detail</A></td>
  <td><A HREF="` + reportName + `_playerdetail.html">Individual Detail</A></td>
  <td><A HREF="` + reportName + `_rounds.html">Round Report</A></td>
  <td><A HREF="` + reportName + `_statkey.html">Stat Key</A></td>
</tr>
</table>
<style>
.ContentContainer * {
  font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.ContentContainer table {
  border-collapse: collapse;
  border: none;
  width: 100%;
}
.ContentContainer td {
  padding: 0.5rem;
}
.ContentContainer table:not(:first-child) tr:first-child {
  border-bottom: 1px solid #000;
}
.ContentContainer tr:nth-child(2n) {
  background: #ddd;
}
.ContentContainer tr:not(:first-child):hover {
  background: #ccc;
}
.ContentContainer table:not(:first-child) a {
	display: block;
	height: 100%;
	width: 100%;
	color: none;
	text-decoration: none;
}
</style>
`;

var setStdGameLength = function (newLength) {
	stdGameLength = newLength;
	return stdGameLength;
}
var setReportName = function (newName) {
	reportName = newName;
	tableStyle = `
<table border=0 width=100%>
<tr>
  <td><A HREF="` + reportName + `_standings.html">Standings</A></td>
  <td><A HREF="` + reportName + `_individuals.html">Individuals</A></td>
  <td><A HREF="` + reportName + `_games.html">Scoreboard</A></td>
  <td><A HREF="` + reportName + `_teamdetail.html">Team Detail</A></td>
  <td><A HREF="` + reportName + `_playerdetail.html">Individual Detail</A></td>
  <td><A HREF="` + reportName + `_rounds.html">Round Report</A></td>
  <td><A HREF="` + reportName + `_statkey.html">Stat Key</A></td>
</tr>
</table>
<style>
.ContentContainer * {
  font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.ContentContainer table {
  border-collapse: collapse;
  border: none;
	width: 100%;
}
.ContentContainer td {
  padding: 0.5rem;
}
.ContentContainer table:not(:first-child) tr:first-child {
  border-bottom: 1px solid #000;
}
.ContentContainer tr:nth-child(2n) {
	background: #ddd;
}
.ContentContainer tr:not(:first-child):hover {
  background: #ccc;
}
.ContentContainer table:not(:first-child) a {
	display: block;
	height: 100%;
	width: 100%;
	color: none;
	text-decoration: none;
}
</style>
`;
}
var game = function (stringStat) {
	stringStat = stringStat.split(/\s*\.\s*/); // each team
  var round = Number(stringStat[0]);
  stringStat = stringStat[1].split(/\s*\;\s*/);
  var teamStatlines = {};
  for (var x of stringStat) {
  	var moreSplit = x.split(/\s*\:\s*/); // first is team name second is everything else
    var somewhatMoreSplit = moreSplit[1].split(/\s*\=\s*/);
    var evenMoreSplit = somewhatMoreSplit[0].split(/\s*\,\s*/);
    var playerStatlines = {};
    for (var player of evenMoreSplit) {
    	var getThatSplit = player.split(/\s*\-\s*/); // name, then result
      var muahahaSplit = getThatSplit[1].split(/\s*\/\s*/) // all the numbers D:
      var playerStatline = new PlayerStatline(players[getThatSplit[0]], Number(muahahaSplit[0]), Number(muahahaSplit[1]), Number(muahahaSplit[2]), Number(muahahaSplit[3]));
      playerStatlines[getThatSplit[0]] = playerStatline;
    }
    var blehSplitImTired = somewhatMoreSplit[1].split(/\s*\/\s*/);
    var teamStatline = new TeamStatline(teams[moreSplit[0]], playerStatlines, Number(blehSplitImTired[0]), Number(blehSplitImTired[1]), Number(blehSplitImTired[2]));
    teamStatlines[moreSplit[0]] = teamStatline;
  }
  var keys = Object.keys(teamStatlines);
  var t1n = keys[0];
  var t2n = keys[1];
  var winnerTeam, loserTeam;
  if (teamStatlines[t1n].points > teamStatlines[t2n].points) {
  	winnerTeam = teams[t1n];
    loserTeam = teams[t2n];
  } else {
  	winnerTeam = teams[t2n];
    loserTeam = teams[t1n];
  }
  var game = new Game(round, teamStatlines, winnerTeam, loserTeam);
  games.push(game);
  return game;
}
var team  = function (str) {
	str = str.split(/\s*\:\s*/);
  var name = str[0];
  var bracket = str[2];
  var playerNames = str[1].split(/\s*\,\s*/);
  for (var player of playerNames) {
  	players[player] = new Player(player, name);
  }
	if (bracket == null) {
		bracket = 'All Games';
	}
  var team = new Team(name, playerNames, bracket);
  teams[name] = team;
  return team;
}
var printTeams = function () { console.log(teams); }
var printPlayers = function () { console.log(players); }
var printGames = function () { console.log(games); }

var getTeamsByBracket = function () {
	var bracketTeams = {};
  var teamNames = Object.keys(teams);
  for (var teamName of teamNames) {
  	var team = teams[teamName];
    if (bracketTeams[team.bracket] == null) {
    	bracketTeams[team.bracket] = {};
    }
    bracketTeams[team.bracket][teamName] = team;
  }
  return bracketTeams;
}
var sortTeamsByRecordPPG = function (teamNames) {
	var newTeamNames = [];
  for (var i = 0; i < teamNames.length; i++) {
  	var maxIndex = 0;
    while (newTeamNames.indexOf(teamNames[maxIndex]) !== -1) {
    	maxIndex++;
    }
    for (var j = maxIndex + 1; j < teamNames.length; j++) {
    	if (newTeamNames.indexOf(teamNames[j]) !== -1) {
      	continue;
      }
      var jWins = teams[teamNames[j]].wins();
      var mWins = teams[teamNames[maxIndex]].wins();
      var jL = teams[teamNames[j]].losses();
      var mL = teams[teamNames[maxIndex]].losses();
      var jPPG = teams[teamNames[j]].ppg();
      var mPPG = teams[teamNames[maxIndex]].ppg();
      if (jWins > mWins) {
      	maxIndex = j; continue;
      } else if (mL > jL) {
      	maxIndex = j; continue;
      } else if (jWins === mWins && jPPG > mPPG) {
      	maxIndex = j; continue;
      }
    }
    newTeamNames.push(teamNames[maxIndex]);
  }
  return newTeamNames;
}
var sortPlayersByPPG = function (playerNames) {
	var newPlayerNames = [];
  for (var i = 0; i < playerNames.length; i++) {
  	var maxIndex = 0;
    while (newPlayerNames.indexOf(playerNames[maxIndex]) !== -1) {
    	maxIndex++;
    }
    for (var j = maxIndex + 1; j < playerNames.length; j++) {
    	if (newPlayerNames.indexOf(playerNames[j]) !== -1) {
      	continue;
      } else if (players[playerNames[j]].ppg() > players[playerNames[maxIndex]].ppg()) {
      	maxIndex = j;
      }
    }
    newPlayerNames.push(playerNames[maxIndex]);
  }
  return newPlayerNames;
}
var getGamesByRound = function () {
	var rounds = {};
  for (var game of games) {
  	if (rounds[game.round] == null) {
    	rounds[game.round] = [];
    }
    rounds[game.round].push(game);
  }
  return rounds;
}

var genStandings = function () {
	var path = window.location.href.split();
  path.pop();
  var newPath = '';
  for (var component of path) {
  	newPath += component;
    newPath += '/';
  }
	var brackets = getTeamsByBracket();
  $('body').empty();
  $('body').append('<h1>Standings</h1>');
  for (var bracketRaw of Object.keys(brackets)) {
  	var bracket = bracketRaw.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '');
  	bracketTeams = brackets[bracketRaw];
    $('body').append('<h2>' + bracketRaw + '</h2>');
    $('body').append('<table class="' + bracket + ' table table-striped table-bordered table-hover"></table');
    $('table.' + bracket).append('<tr><td>#</td><td>Name</td><td>Wins</td><td>Losses</td><td>W%</td><td>PPG</td><td>Opponent PPG</td><td>Average Margin</td><td>Powers</td><td>Gets</td><td>Negs</td><td>TUH</td><td>PPTH</td><td>P/N</td><td>BH</td><td>Bonus Points</td><td>PPB</td></tr>');
    var teamNames = sortTeamsByRecordPPG(Object.keys(bracketTeams));
    var i = 0;
    for (var teamName of teamNames) {
    	i++;
    	var team = teams[teamName];
      var nameAsId = teamName.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '');
    	$('table.' + bracket).append('<tr id="standings-' + nameAsId + '"><td>' + i + '</td><td>' + teamName + '</td><td>' + team.wins() + '</td><td>' + team.losses() + '</td><td>' + team.wpct() + '</td><td>' + team.ppg() + '</td><td>' + team.papg() + '</td><td>' + team.mrg() + '</td><td>' + team.powers() + '</td><td>' + team.gets() + '</td><td>' + team.negs() + '</td><td>' + team.tuh() + '</td><td>' + team.ppth() + '</td><td>' + team.pn() + '</td><td>' + team.bh() + '</td><td>' + team.bpts() + '</td><td>' + team.ppb() + '</td></tr>'); // sweet jesus that's ugly
    }
  }
	fs.writeFile(reportName + '_standings.html', `<HTML>\n<HEAD>\n</HEAD>\n<BODY>` + tableStyle + formatter.render($('body').html()).replace(/\t/g, '  ') + `\n<br>\n<h5>Made with Intermezzo.</h5>\n</BODY>\n</HTML>\n`, function (err) {});
}
var genIndividuals = function () {
 	var path = window.location.href.split(); path.pop(); var newPath = ''; for (var component of path) { newPath += component; newPath += '/'; }
	var playerNames = sortPlayersByPPG(Object.keys(players));
  $('body').empty();
  $('body').append('<h1>Individuals</h1>');
  $('body').append('<table class="individuals table table-striped table-bordered table-hover"></table');
  $('table.individuals').append('<tr><td>#</td><td>Name</td><td>Team</td><td>Bracket</td><td>Games Played</td><td>Powers</td><td>Gets</td><td>Negs</td><td>TUH</td><td>Points</td><td>PPTH</td><td>P/N</td><td>PPG</td></tr>');
  var i = 0;
  for (var name of playerNames) {
  	i++;
    var player = players[name];
    var nameAsId = name.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '');
    $('table.individuals').append('<tr id="standings-' + nameAsId + '"><td>' + i + '</td><td>' + name + '</td><td>' + player.teamName + '</td><td>' + teams[player.teamName].bracket + '</td><td>' + player.gp() + '</td><td>' + player.powers() + '</td><td>' + player.gets() + '</td><td>' + player.negs() + '</td><td>' + player.tuh() + '</td><td>' + player.points() + '</td><td>' + player.ppth() + '</td><td>' + player.pn() + '</td><td>' + player.ppg() + '</td></tr>');
		$('#standings-' + nameAsId + ' td').each(function () {
			$(this).html('<A HREF=' + reportName + '"_playerdetail.html#' + nameAsId + '">' + $(this).text() + '</A>')
		});
		// onclick="window.location.href = \'../playerdetail#' + nameAsId + '\';"
	}
	fs.writeFile(reportName + '_individuals.html', `<HTML>\n<HEAD>\n</HEAD>\n<BODY>` + tableStyle + formatter.render($('body').html()).replace(/\t/g, '  ') + `\n<br>\n<h5>Made with Intermezzo.</h5>\n</BODY>\n</HTML>\n`, function (err) {});
}
var genTeamDetail = function () {
	var teamNames = Object.keys(teams);
  $('body').empty();
  $('body').append('<h1>Team Detail</h1>');
  for (var nameRaw of teamNames) {
  	var name = nameRaw.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '').replace(/[^A-Za-z\-]+/g, '').replace(/[^A-Za-z\-]+/g, '');
  	team = teams[nameRaw];
    $('body').append('<h2 name="' + name + '">'+ nameRaw + '</h2>');
    $('body').append('<table class="table table-striped table-bordered table-hover detail-' + name + '"></table>');
    $('table.detail-' + name).append('<tr><td>Opponent</td><td>Result</td><td>Score</td><td>Powers</td><td>Gets</td><td>Negs</td><td>TUH</td><td>PPTH</td><td>P/N</td><td>BH</td><td>Bonus Points</td><td>PPB</td></tr>');
    for (var game of team.games) {
    	var thisStatline = game.teamStatlines[nameRaw];
    	$('table.detail-' + name).append('<tr><td>' + game.opponentName(nameRaw) + '</td><td>' + game.result(nameRaw) + '</td><td>' + thisStatline.points + '-' + game.teamStatlines[game.opponentName(nameRaw)].points + '</td><td>' + thisStatline.powers + '</td><td>' + thisStatline.gets + '</td><td>' + thisStatline.negs + '</td><td>' + thisStatline.tuh + '</td><td>' + Math.round(100*thisStatline.points/thisStatline.tuh)/100 + '</td><td>' + Math.round(100*thisStatline.powers/thisStatline.negs)/100 + '</td><td>' + thisStatline.bh + '</td><td>' + thisStatline.bonusPoints + '</td><td>' + Math.round(100*thisStatline.bonusPoints/thisStatline.bh)/100 + '</td></tr>');
    }
    $('table.detail-' + name).append('<tr><td>Total</td><td>' + team.wins() + '-' + team.losses() + '</td><td>' + team.points() + '-' + team.opponentPoints() + '</td><td>' + team.powers() + '</td><td>' + team.gets() + '</td><td>' + team.negs() + '</td><td>' + team.tuh() + '</td><td>' + team.ppth() + '</td><td>' + team.pn() + '</td><td>' + team.bh() + '</td><td>' + team.bpts() + '</td><td>' + team.ppb() + '</td></tr>');
    $('body').append('<h3>Players:</h3>');
    $('body').append('<table class="table table-striped table-bordered table-hover individuals-' + name + '"></table>');
    $('table.individuals-' + name).append('<tr><td>Player Name</td><td>Games Played</td><td>Powers</td><td>Gets</td><td>Negs</td><td>TUH</td><td>Points</td><td>PPTH</td><td>P/N</td><td>PPG</td></tr>');
    for (var playerName of team.playerNames) {
    	var player = players[playerName];
      $('table.individuals-' + name).append('<tr><td>' + playerName + '</td><td>' + player.gp() + '</td><td>' + player.powers() + '</td><td>' + player.gets() + '</td><td>' + player.negs() + '</td><td>' + player.tuh() + '</td><td>' + player.points() + '</td><td>' + player.ppth() + '</td><td>' + player.pn() + '</td><td>' + player.ppg() + '</td></tr>');
    }
    $('body').append('<br>');
  }
	fs.writeFile(reportName + '_teamdetail.html', `<HTML>\n<HEAD>\n</HEAD>\n<BODY>` + tableStyle + formatter.render($('body').html()).replace(/\t/g, '  ') + `\n<br>\n<h5>Made with Intermezzo.</h5>\n</BODY>\n</HTML>\n`, function (err) {});
}
var genPlayerDetail = function () {
	var playerNames = Object.keys(players);
  $('body').empty();
  $('body').append('<h1>Individual Detail</h1>');
  for (var nameRaw of playerNames) {
  	var name = nameRaw.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '');
  	player = players[nameRaw];
    $('body').append('<h2 name="' + name + '">'+ nameRaw + '</h2>');
    $('body').append('<table class="table table-striped table-bordered table-hover detail-' + name + '"></table>');
    $('table.detail-' + name).append('<tr><td>Opponent</td><td>Powers</td><td>Gets</td><td>Negs</td><td>Tossups Heard (TUH)</td><td>Points per Tossup (PPTH)</td><td>Powers per Neg (P/N)</td><td>Points</td></tr>');
    for (var game of player.games) {
    	var thisStatline = game.teamStatlines[player.teamName].playerStatlines[nameRaw];
    	$('table.detail-' + name).append('<tr><td>' + game.opponentName(player.teamName) + '</td><td>' + thisStatline.powers + '</td><td>' + thisStatline.gets + '</td><td>' + thisStatline.negs + '</td><td>' + thisStatline.tuh + '</td><td>' + Math.round(100*thisStatline.points/thisStatline.tuh)/100 + '</td><td>' + Math.round(100*thisStatline.powers/thisStatline.negs)/100 + '</td><td>' + thisStatline.points + '</td></tr>');
    }
   	$('table.detail-' + name).append('<tr><td>Total</td><td>' + player.powers() + '</td><td>' + player.gets() + '</td><td>' + player.negs() + '</td><td>' + player.tuh() + '</td><td>' + player.ppth() + '</td><td>' + player.pn() + '</td><td>' + player.points() + '</td></tr>')
    $('body').append('<br>');
  }
	fs.writeFile(reportName + '_playerdetail.html', `<HTML>\n<HEAD>\n</HEAD>\n<BODY>` + tableStyle + formatter.render($('body').html()).replace(/\t/g, '  ') + `\n<br>\n<h5>Made with Intermezzo.</h5>\n</BODY>\n</HTML>\n`, function (err) {});
}
var genScoreboard = function () {
	var roundGames = getGamesByRound();
  var rounds = Object.keys(roundGames).sort(function (a, b) { return a - b; });
  $('body').empty();
  $('body').append('<h1>Scoreboard</h1>');
  for (var round of rounds) {
  	$('body').append('<h2 name="r' + round + '">Round ' + round + '</h2>');
  	var theseGames = roundGames[round];
    for (var game of theseGames) {
    	var id = 'match-' + game.winnerTeam.name.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '').replace(/[^A-Za-z\-]+/g, '') + '-' + game.loserTeam.name.replace(/\s+/g, '-').replace(/[^A-Za-z\-]+/g, '') + '-' + game.round;
      var statline; // used in loops
    	$('body').append('<div id="' + id + '"></div>');
    	$('#' + id).append('<h3>' + game.winnerTeam.name + ' ' + game.teamStatlines[game.winnerTeam.name].points + '-' + game.teamStatlines[game.loserTeam.name].points + ' ' + game.loserTeam.name + '</h3>');
      var winner = game.winnerTeam.name + ': ';
      var winnerStatline = game.teamStatlines[game.winnerTeam.name];
      for (var playerName of Object.keys(game.teamStatlines[game.winnerTeam.name].playerStatlines)) {
        winner += playerName;
        statline = winnerStatline.playerStatlines[playerName];
        winner += ' ';
        winner += statline.powers;
        winner += '/';
        winner += statline.gets;
        winner += '/'
        winner += statline.negs;
        winner += ' over ';
        winner += statline.tuh;
        winner += ' tossups, ';
      }
      winner += winnerStatline.bonusPoints + ' bonus points over ' + winnerStatline.bh + ' bonuses [' + Math.round(100*winnerStatline.bonusPoints/winnerStatline.bh)/100 + ' PPB]';
      $('#' + id).append('<div>' + winner + '</div>');
      var loser = game.loserTeam.name + ': ';
			var loserStatline = game.teamStatlines[game.loserTeam.name];
			for (playerName of Object.keys(game.teamStatlines[game.loserTeam.name].playerStatlines)) {
				loser += playerName;
				statline = loserStatline.playerStatlines[playerName];
				loser += ' ';
				loser += statline.powers;
				loser += '/';
				loser += statline.gets;
				loser += '/';
				loser += statline.negs;
				loser += ' over ';
				loser += statline.tuh;
				loser += ' tossups, ';
			}
			loser += loserStatline.bonusPoints + ' bonus points over ' + loserStatline.bh + ' bonuses [' + Math.round(100*loserStatline.bonusPoints/loserStatline.bh)/100 + ' PPB]';
			$('#' + id).append('<div>' + loser + '</div>');
    }
  }
	fs.writeFile(reportName + '_games.html', `<HTML>\n<HEAD>\n</HEAD>\n<BODY>` + tableStyle + formatter.render($('body').html()).replace(/\t/g, '  ') + `\n<br>\n<h5>Made with Intermezzo.</h5>\n</BODY>\n</HTML>\n`, function (err) {});
}
var genRoundReport = function () {
	var roundGames = getGamesByRound();
  var rounds = Object.keys(roundGames).sort(function (a, b) { return a - b; });
  $('body').empty();
  $('body').append('<h1>Round Report</h1><br>');
  $('body').append('<table class="table table-striped table-bordered round-report"></table>');
  $('table.round-report').append('<tr><td>Round</td><td>Average PPG</td><td>Average Tossup Conversion</td><td>Average PPB</td></tr>');
  for (var round of rounds) {
  	var theseGames = roundGames[round];
    var gamePoints = 0;
    var tossupPoints = 0;
    var tuh = 0;
    var bonusPoints = 0;
    var bh = 0;
    for (var game of theseGames) {
    	for (var teamName of Object.keys(game.teamStatlines)) {
      	var statline = game.teamStatlines[teamName];
        gamePoints += statline.points;
        tossupPoints += statline.points;
        tossupPoints -= statline.bonusPoints;
        tuh += statline.tuh;
        bonusPoints += statline.bonusPoints;
        bh += statline.bh;
      }
    }
    $('table.round-report').append('<tr><td>' + round + '</td><td>' + Math.round(50*gamePoints/theseGames.length)/100 + '</td><td>' + Math.round(100*tossupPoints/tuh)/100 + '</td><td>' + Math.round(100*bonusPoints/bh)/100 + '</td></tr>');
  }
	fs.writeFile(reportName + '_rounds.html', `<HTML>\n<HEAD>\n</HEAD>\n<BODY>` + tableStyle + formatter.render($('body').html()).replace(/\t/g, '  ') + `\n<br>\n<h5>Made with Intermezzo.</h5>\n</BODY>\n</HTML>\n`, function (err) {});
}
var genAll = function () {
	genStandings(); genIndividuals(); genTeamDetail(); genPlayerDetail(); genScoreboard(); genRoundReport();
}
var loadFile = function (fileName) {
	var file = String(fs.readFileSync(fileName)).split('\n');
	var teams = Number(file[0]);
	var i;
	for (i = 1; i < teams + 1; i++) {
		console.log(file[i]);
		team(file[i]);
	}
	for (i = i; i < file.length; i++) {
		console.log(file[i]);
		if (file[i].length > 2) {
			game(file[i]);
		}
	}
	genAll();
}
var exports = {};
exports.team = team;
exports.game = game;
exports.printTeams = printTeams;
exports.printGames = printGames;
exports.printPlayers = printPlayers;
exports.genStandings = genStandings;
exports.genIndividuals = genIndividuals;
exports.genTeamDetail = genTeamDetail;
exports.genPlayerDetail = genPlayerDetail;
exports.genScoreboard = genScoreboard;
exports.genRoundReport = genRoundReport;
exports.genAll = genAll;
exports.loadFile = loadFile;
exports.setStdGameLength = setStdGameLength;
exports.setReportName = setReportName;
module.exports = exports;
