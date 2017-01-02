  var gameOptions = {
    height: 500,
    width: 750,
    nEnemies: 30,
    padding: 20
  };

  var gameStats = {
    score: 0,
    bestScore: 0,
    collisions: 0
  };

  var axes = {
    x: d3.scale.linear().domain([0, 100]).range([0, gameOptions.width]),
    y: d3.scale.linear().domain([0, 100]).range([0, gameOptions.height])
  };

  var gameBoard = d3.select('.scoreboard').append('svg:svg').attr('width', gameOptions.width).attr('height', gameOptions.height);

  var updateScore = function() {
    return d3.select('.current span').text(gameStats.score.toString());
  };

  var updateBestScore = function() {
    gameStats.bestScore = _.max([gameStats.bestScore, gameStats.score, gameStats.collisions]);
    return d3.select('.highscore span').text(gameStats.bestScore.toString());
  };
  var updateCollisions = function() {
    return d3.select('.collisions span').text(gameStats.collisions.toString());
  };

  var Player = (function() {

    this.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';

    this.fill = '#c0c5ce';
    this.x = 0;

    this.y = 0;

    this.angle = 0;

    this.r = 5;

    function Player(gameOptions) {
      this.setupDragging = (this.setupDragging, this);
      this.moveRelative = (this.moveRelative, this);
      this.moveAbsolute = (this.moveAbsolute, this);
      this.transform = (this.transform, this);
      this.setY = (this.setY, this);
      this.getY = (this.getY, this);
      this.setX = (this.setX, this);
      this.getX = (this.getX, this);
      this.render = (this.render, this);      
      this.gameOptions = gameOptions;
    }

    this.render = function(to) {
      this.el = to.append('svg:path').attr('d', this.path).attr('fill', this.fill);
      this.transform({
        x: this.gameOptions.width * 0.5,
        y: this.gameOptions.height * 0.5
      });
      this.setupDragging();
      return this;
    };

    this.getX = function() {
      return this.x;
    };

    this.setX = function(x) {
      var maxX, minX;
      minX = this.gameOptions.padding;
      maxX = this.gameOptions.width - this.gameOptions.padding;
      if (x <= minX) x = minX;
      if (x >= maxX) x = maxX;
      return this.x = x;
    };

    this.getY = function() {
      return this.y;
    };

    this.setY = function(y) {
      var maxY, minY;
      minY = this.gameOptions.padding;
      maxY = this.gameOptions.height - this.gameOptions.padding;
      if (y <= minY) y = minY;
      if (y >= maxY) y = maxY;
      return this.y = y;
    };

    this.transform = function(opts) {
      this.angle = opts.angle || this.angle;
      this.setX(opts.x || this.x);
      this.setY(opts.y || this.y);
      return this.el.attr('transform', ("rotate(" + this.angle + "," + (this.getX()) + "," + (this.getY()) + ") ") + ("translate(" + (this.getX()) + "," + (this.getY()) + ")"));
    };

    this.moveAbsolute = function(x, y) {
      return this.transform({
        x: x,
        y: y
      });
    };

    this.moveRelative = function(dx, dy) {
      return this.transform({
        x: this.getX() + dx,
        y: this.getY() + dy,
        angle: 360 * (Math.atan2(dy, dx) / (Math.PI * 2))
      });
    };

    this.setupDragging = function() {
      var drag, dragMove,
        _this = this;
      dragMove = function() {
        return _this.moveRelative(d3.event.dx, d3.event.dy);
      };
      drag = d3.behavior.drag().on('drag', dragMove);
      return this.el.call(drag);
    };

    return Player;

  })();

  var players = [];

  players.push(render(gameBoard));

  var createEnemies = function() {
    return _.range(0, gameOptions.nEnemies).map(function(i) {
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      };
    });
  };

  var render = function(enemy_data) {
    
    var enemies = gameBoard.selectAll('circle').data(enemy_data, function(d) {
      return d.id;
    });

    var svg = enemies.enter().append('svg')
    svg.append('defs').append('pattern').attr('id', 'image')
    .attr('x', '0%').attr('y', '0%').attr('height', '100%').attr('width', '100%')
    .attr('viewBox', '0 0 512 512')

    .append('image')
    .attr('xlink:href','asteroid.png')
    .attr('x', '0%').attr('y', '0%').attr('height', '512').attr('width', '512')
    .attr('id', 'image')
   
    svg.append('circle').attr('class', 'enemy').attr('cx', function(enemy) {
      return axes.x(enemy.x);
    }).attr('cy', function(enemy) {
      return axes.y(enemy.y);
    }).attr('r', 10).attr('fill','url(#image)')
    enemies.exit().remove();
    var checkCollision = function(enemy, collidedCallback) {
      return _(players).each(function(player) {
        var radiusSum, separation, xDiff, yDiff;
        radiusSum = parseFloat(enemy.attr('r')) + player.r;
        xDiff = parseFloat(enemy.attr('cx')) - player.x;
        yDiff = parseFloat(enemy.attr('cy')) - player.y;
        separation = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
        if (separation < radiusSum) return collidedCallback(player, enemy);
      });
    };

    var onCollision = function() {
      updateBestScore();
      gameStats.score = 0;
      if(gameStats.score === 0){
      	 gameStats.collisions += 1;
      	 if(gameStats.collisions > 4){
      	 	gameStats.collisions = 0;
      	 	gameStats.bestScore = 0
      	 }
      	return updateCollisions();
      }
      return updateScore();
    };

    var tweenWithCollisionDetection = function(endData) {
      var endPos, enemy, startPos;
      enemy = d3.select(this);
      startPos = {
        x: parseFloat(enemy.attr('cx')),
        y: parseFloat(enemy.attr('cy'))
      };
      endPos = {
        x: axes.x(endData.x),
        y: axes.y(endData.y)
      };
      return function(t) {
        var enemyNextPos;
        checkCollision(enemy, onCollision);
        enemyNextPos = {
          x: startPos.x + (endPos.x - startPos.x) * t,
          y: startPos.y + (endPos.y - startPos.y) * t
        };
        return enemy.attr('cx', enemyNextPos.x).attr('cy', enemyNextPos.y);
      };
    };
    return enemies.transition().duration(500).attr('r', 10).transition().duration(2000).tween('custom', tweenWithCollisionDetection);
  };

  var play = function() {
    var gameTurn, increaseScore;
    gameTurn = function() {
      var newEnemyPositions;
      newEnemyPositions = createEnemies();
      return render(newEnemyPositions);
    };
    increaseScore = function() {
      gameStats.score += 1;
      return updateScore();
    };
    gameTurn();
    setInterval(gameTurn, 2000);
    return setInterval(increaseScore, 50);
  };

  play();

      

