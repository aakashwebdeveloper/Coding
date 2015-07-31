$(function(){


  window.App.Models.SquareModel = Backbone.Model.extend({
    defaults: {
      square_id: false,
      hot: false,
      selected: false,
      highlight: false
    },
    validate: function(attrs) {
      if (attrs.square_id === undefined) {
        return "You must set a square_id.";
      }
    },
    isHot: function() {
      return this.attributes.hot;
    },
    isSelected: function() {
      return this.attributes.selected;
    },
    isHighlighted: function() {
      return this.attributes.highlight;
    },
   
    addHighlight: function() {
      this.set( { highlight: true } );
      var m = this;
      window.App.appView.freezeBoard();
      
      var timeoutId = setTimeout( function() { 
        m.set( { highlight: false } ); 
        window.App.appView.unfreezeBoard();
      }, 5000 );
			window.App.timeouts.push( timeoutId );
    }
  });


  window.App.Collections.Squares = Backbone.Collection.extend({
    model: window.App.Models.SquareModel
  });

  window.App.Views.SquareView = Backbone.View.extend({
    className: 'square',  
    events: {
      'click': 'selectSquare'
    },
    initialize: function() {
      this.listenTo( this.model, "change:highlight", this.changeHighlight );
    },
    render: function() {
      return this;
    },
    selectSquare: function( e ) {
      if ( this.model.isSelected() || window.App.appView.frozenBoard ) {
      	return; 
      }
      if ( this.model.isHot() ) {
        this.$el.addClass( "selected" );
        this.model.set( "selected", true );
        this.didYouWin();
      } else {
        this.$el.addClass( "wrong" );
        this.youLost();
      }
    },
    didYouWin: function() {
      var selectedSquares = window.App.squares.where( { selected: true } );
      var total = Math.round( window.App.config.rows * window.App.config.cols * window.App.config.hotRatio );
      if ( selectedSquares.length >= total ) {
        window.App.appView.successMessage();
				window.App.appView.freezeBoard();
      } 
    },
    youLost: function() {
      window.App.appView.errorMessage();
      window.App.appView.freezeBoard();
    },
    changeHighlight: function() {
      var hl = this.model.get( "highlight" );
      if ( hl ) {
        this.$el.addClass( "highlight" );
      } else {
        this.$el.removeClass( "highlight" );
      }
    }
  });


  window.App.Views.AppView = Backbone.View.extend({
    template: _.template( $("#app-template").html() ),
    frozenBoard: false,
    events: {
      'click #startGame': 'startGame',
      'click #resetGame': 'resetGame'
    },
    initialize: function() {
      $(".container").html( this.render().el );
      this.buildGame();
      this.controls( "startGame" );
    },
    render: function() {
      this.$el.html( this.template() );
      return this;
    },
   
    buildGame: function() {
      var hotList = this.randomizeHotList();
      $board = $( "<div></div>" );
      // Loop through rows
      for ( var i = 1; i <= window.App.config.rows; i++ ) {
        // Create the jQuery row and rowContainer elements
        $row = $( "<div></div>" ).addClass( "row" );
        $rowContainer = $( "<div></div>" )
          .addClass( "col-sm-8" )
          .addClass( "col-sm-offset-2" )
          .addClass( "col-md-6" )
          .addClass( "col-md-offset-3" );
        $row.append( $rowContainer );
        
        for ( var j = 1; j <= window.App.config.cols; j++ ) {
          var square_id = this.generateId( i, j );
      
          window.App.squares.on( "add", function( m ) {
            var view = new window.App.Views.SquareView( { model: m } );
            $rowContainer.append( view.render().el );
          });
          var data = { square_id: square_id };
          if ( $.inArray( square_id, hotList ) != -1 ) {
            data.hot = true;
          } 
          window.App.squares.add( data );
          window.App.squares.off( "add" );
        }
        $board.append( $row );
      }
      $("#gameContainer").html( $board );
      
      this.squareHeight();
      
      this.freezeBoard();
    },
   
    startGame: function() {
      this.showHotSquares();
      this.controls( "gameStarted" );
    },
    
    resetGame: function() {
      window.App.squares.reset();
			this.clearTimeouts(); 
      this.buildGame();
      this.startGame();
      this.clearMessages();
    },
		
		clearTimeouts: function() 
		{
			for ( var i = 0; i <= window.App.timeouts.length + 1; i++ ) {
				clearTimeout( window.App.timeouts[i] );
				delete window.App.timeouts[i];
			}
		},
  
    freezeBoard: function() {
      this.frozenBoard = true;
    },
    
    unfreezeBoard: function() {
      this.frozenBoard = false;
    },
    
    showHotSquares: function() {
      var hotSquares = window.App.squares.where( { hot: true } );
      for ( var i = 0; i < hotSquares.length; i++ ) {
        hotSquares[i].addHighlight();
      }
    },
  
    generateId: function(row,col) {
      return window.App.config.cols * (row - 1) + col;
    },
  
    randomizeHotList: function() {
      var arr = [];
      var total = Math.round( window.App.config.rows * window.App.config.cols * window.App.config.hotRatio );
      for( x = 1; x <= total; x++ ){
        var tmp = Math.floor( Math.random() * 25 ) + 1;
        while ( $.inArray( tmp, arr ) != -1 ) {
          tmp = Math.floor( Math.random() * 25 ) + 1;
        }
        arr.push( tmp );
      }
      return arr;
    },
   
    controls: function( mes ) {
      switch( mes ) {
        case "startGame":
          $("#startGame").show();
          $("#resetGame").hide();
          break;
        case "gameStarted":
          $("#startGame").hide();
          $("#resetGame").show();
          break;
      }
    },
    
    squareHeight: function() {
      $(window).off("resize");
      this.$(".square").height(this.$(".square").width());
     
      $(window).on("resize",function(){
        this.$(".square").height(this.$(".square").width());
      });
    },
    
    
    successMessage: function( message ) {
			this.clearMessages();
      $("#successMessage").show();
    },
   
    errorMessage: function( message ) {
			this.clearMessages();
      $("#errorMessage").show();
    },
    
    clearMessages: function()
    {
      $("#successMessage").hide();
			$("#errorMessage").hide();
    }
  });
});