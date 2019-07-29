function Load() {
    // Interpret novm script & setup context
    Snake = {
        Code: novm.Parser.ParseBlock(`
            |main
                .canvas
                >main, &__context__, =context

                .room size
                >16, <, =roomWidth, =roomHeight

                .grid
                >32, =gridSize

                .snake position
                >8, <, =snakeX, =snakeY
                >3, =snakeDirection

                .game
                >0, =gameTimer
                >5, =gameInterval

            |update
                .game controls
                >37, &__keyCheck__, >1, ?!=, $+2, .press left
                    >0, =snakeDirection
                >39, &__keyCheck__, >1, ?!=, $+2, .press right
                    >1, =snakeDirection
                >38, &__keyCheck__, >1, ?!=, $+2, .press up
                    >2, =snakeDirection
                >40, &__keyCheck__, >1, ?!=, $+2, .press down
                    >3, =snakeDirection

                .game tick
                >1, @gameTimer, +, =gameTimer
                @gameTimer, @gameInterval, ?<, $endTimer
                    .move snake
                    >0, @snakeDirection, ?!=, $+4, .move left
                        @snakeX, >1, -, =snakeX
                    >1, @snakeDirection, ?!=, $+4, .move right
                        @snakeX, >1, +, =snakeX
                    >2, @snakeDirection, ?!=, $+4, .move up
                        @snakeY, >1, -, =snakeY
                    >3, @snakeDirection, ?!=, $+4, .move down
                        @snakeY, >1, +, =snakeY

                    .wrap snake
                    @snakeX, >-1, ?>, $+4, .wrap left
                        @roomWidth, >1, -, =snakeX
                    @snakeX, @roomWidth, ?<, $+2, .wrap right
                        >0, =snakeX
                    @snakeY, >-1, ?>, $+4, .wrap up
                        @roomHeight, >1, -, =snakeY
                    @snakeY, @roomHeight, ?<, $+2, .wrap right
                        >0, =snakeY

                    .reset timer
                    >0, =gameTimer
                !endTimer

                &render

            |render
                .render room
                >0, =yy
                !fory
                    >0, =xx
                    !forx
                        >yellow, @gridSize, <, @yy, *, @gridSize, @xx, *, @context, &__rect__
                        >purple, @gridSize, >1, -, @gridSize, @yy, *, @gridSize, @xx, *, @context, &__rect__
                    >1, @xx, +, =xx
                    @xx, @roomWidth, ?<, $forx
                >1, @yy, +, =yy
                @yy, @roomHeight, ?<, $fory

                .render player
                >green, @gridSize, <, @snakeY, *, @gridSize, @snakeX, *, @context, &__rect__
        `),
        Stack: [],
        Variables: {},
        Input: {}
    };

    // Interface functions
    novm.Interface["__stack__"] = function(stack) {
        console.log(stack);
    }

    // context, width, height
    novm.Interface["__clear__"] = function(stack) {
        let Context = stack.pop(), Width = stack.pop(), Height = stack.pop();
        Context.clearRect(0, 0, Width, Height);
    }

    // context, x, y, size, color
    novm.Interface["__rect__"] = function(stack) {
        let Context = stack.pop(), Position = [stack.pop(), stack.pop()], Size = stack.pop();
        Context.fillStyle = stack.pop();
        Context.fillRect(Position[0], Position[1], Size, Size);
        //for(var i = 0; i < 3; i++) stack.pop();
    }

    novm.Interface["__keyCheck__"] = function(stack) {
        stack.push((stack.pop() in Snake.Input));
    }

    novm.Interface["__context__"] = function(stack) {
        let Canvas = document.getElementById(stack.pop());
        stack.push(Canvas.getContext("2d"));
    }

    // Call main function of novm script
    novm.Core.Execute(Snake.Code.Functions["main"], undefined, undefined, Snake.Stack, Snake.Variables, Snake.Code);

    // Input hook
    document.addEventListener("keydown", e => {
        Snake.Input[e.keyCode] = true;
    });

    document.addEventListener("keyup", e => {
        if (e.keyCode in Snake.Input) delete Snake.Input[e.keyCode];
    });

    // Run update function of novm script every (1000 / 60)ms
    Loop = window.setInterval(() => {
        if (novm.Core.Errors.length == 0) {
            novm.Core.Execute(Snake.Code.Functions["update"], undefined, undefined, Snake.Stack, Snake.Variables, Snake.Code);
        } else {
            window.clearInterval(Loop);
        }
    }, 1000 / 60);
}