/// novm.js by Nommiin (2019)
novm = {
    // the version
    Version: 0.3,
    // includes runtime
    Core: {
        Errors: [],
        /// @description Takes instructions and runs in a unique context
        /// @argument input List of parsed instructions
        Execute: function(input, Index=0, Layer=1, Stack=[], Variables={}, Block={}) {
            if (Layer > 32) {
                novm.Core.Error("Could not continue executing function, maximum recursion depth met.");
                return [];
            }

            let Running = true;
            for(let i = 0; i < input.length; i++) {
                if (Running == false) return [];
                let Instruction = input[i];
                switch (Instruction.Opcode) {
                    case 0x00: { // Push
                        Stack.push(Instruction.Operand);
                        break;
                    }

                    case 0x01: { // Duplicate
                        if (Stack.length < 1) {
                            novm.Core.Error("Could not duplicate stack top, stack does not contain at least 1 value.", i);
                            Running = false;
                        } else Stack.push(Stack[Stack.length - 1]);
                        break;
                    }

                    case 0x02: { // Invoke
                        let Found = false;
                        if (Instruction.Operand in novm.Interface) {
                            Found = true;
                            novm.Interface[Instruction.Operand](Stack);
                        }
                        if (Instruction.Operand in Block.Functions) {
                            Found = true;
                            let Return = novm.Core.Execute(Block.Functions[Instruction.Operand], undefined, Layer + 1, Stack, Variables, Block);
                            if (Return == undefined) {
                                novm.Core.Error("Could not invoke function \"" + Instruction.Operand + "\", an error occured.", i);
                                Running = false;
                            } else Stack = Return;
                        }

                        if (Found == false) {
                            novm.Core.Error("Could not invoke function \"" + Instruction.Operand + "\", function does not exist.", i);
                            Running = false;
                        }
                        break;
                    }

                    case 0x03: { // Add
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform addition operation, stack does not contain at least 2 values.", i);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a + b);
                        }
                        break;
                    }

                    case 0x04: { // Subtract
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform subtraction operation, stack does not contain at least 2 values.", i);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a - b);
                        }
                        break;
                    }

                    case 0x05: { // Multiply
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform multiplication operation, stack does not contain at least 2 values.", i);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a * b);
                        }
                        break;
                    }

                    case 0x06: { // Divide
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform division operation, stack does not contain at least 2 values.", i);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a / b);
                        }
                        break;
                    }

                    case 0x07: { // Variable
                        if (Stack.length < 1) {
                            novm.Core.Error("Could not assign variable, stack does not contain at least 1 value.", i);
                            Running = false;
                        } else {
                            Variables[Instruction.Operand] = Stack.pop();
                        }
                        break;
                    }

                    case 0x08: { // Reference
                        if (Instruction.Operand in Variables) {
                            Stack.push(Variables[Instruction.Operand]);
                        } else {
                            novm.Core.Error("Could not retrieve variable named \"" + Instruction.Operand + "\", invalid name.", i);
                            Running = false;
                        }
                        break;
                    }

                    case 0x09: { // Compare
                        if (Stack.length < 2) {
                            novm.Core.Error("Could perform comparision, stack does not contain at least 2 values.", i);
                            Running = false; 
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            switch (Instruction.Operand) {
                                case "==": if ((a == b) == false) {
                                    i++;
                                }
                                break;

                                case "!=": if ((a != b) == false) {
                                    i++;
                                }
                                break;

                                case ">": if ((a > b) == false) {
                                    i++;
                                } 
                                break;

                                case "<": if ((a < b) == false) {
                                    i++;
                                }
                                break;

                                case ">=": if ((a >= b) == false) {
                                    i++;
                                }
                                break;

                                case "<=": if ((a <= b) == false) {
                                    i++;
                                }
                                break;

                                default: {
                                    novm.Core.Error("Could perform comparision, invalid comparision token (" + Instruction.Operand + ") given.");
                                    Running = false;
                                }
                            }
                        }
                        break;
                    }

                    case 0x0A: { // Jump
                        if (Instruction.Type == "string") {
                            let Label = Block.Labels[Instruction.Operand];
                            if (Label != undefined) {
                                i = Label - 1;
                            } else {
                                novm.Core.Error("Could not jump to label \"" + Instruction.Operand + "\", invalid name.");
                                Running = false;
                            }
                        } else {
                            if (Instruction.Raw[0] == "-" || Instruction.Raw[0] == "+") {
                                i += Instruction.Operand;
                            } else {
                                i = Instruction.Operand;
                            }
                        }
                        break;
                    }
                }

                if (Index++ > 32000) {
                    novm.Core.Error("Could not continue executing function, maximum loop index met.");
                    return [];
                }
            }
            return Stack;
        },
        Error: function(message, Index=1) {
            console.log("[CORE, @" + Index.toString() + "]: " + message);
            novm.Core.Errors.push(message);
        }
    },
    // includes instruction parser
    Parser: {
        /// @description A list of instructions, containing both runtime and meta data
        Instructions: {
            ">": {
                Name: "Push",
                Desc: "Pushes the given operand to the stack",
                Opcode: 0x00
            },
            "<": {
                Name: "Duplicate",
                Desc: "Copies the value on top of the stack into stack",
                Opcode: 0x01
            },
            "&": {
                Name: "Invoke",
                Desc: "Calls the given function",
                Opcode: 0x02
            },
            "+": {
                Name: "Add",
                Desc: "Pops top two values on stack and pushes the result of them added together",
                Opcode: 0x03
            },
            "-": {
                Name: "Subtract",
                Desc: "Pops top two values on stack and pushes the result of them subtracted from one another",
                Opcode: 0x04
            },
            "*": {
                Name: "Multiply",
                Desc: "Pops top two values on stack and pushes the result of them multiplied by eachother",
                Opcode: 0x05
            },
            "/": {
                Name: "Divide",
                Desc: "Pops top two values on stack and pushes the result of them divided by eachother",
                Opcode: 0x06
            },
            "=": {
                Name: "Variable",
                Desc: "Pops the value on top of the stack into the given variable name",
                Opcode: 0x07
            },
            "@": {
                Name: "Reference",
                Desc: "Pushes the value associated with the variable to the stack",
                Opcode: 0x08
            },
            "?": {
                Name: "Compare",
                Desc: "Compares top two values on stack using the given operation and skips the next instruction if comparision fails",
                Opcode: 0x09
            },
            "$": {
                Name: "Jump",
                Desc: "Moves the instruction pointer to a specific position/label, moves forward or backward if + or - signs are used",
                Opcode: 0x0A
            },
            "!": {
                Name: "Label",
                Desc: "Names the proceeding instruction position for use with the jump instruction",
                Opcode: 0xFE
            },
            "|": {
                Name: "Declare",
                Desc: "Marks the declaration of a function",
                Opcode: 0xFF
            }
        },
        /// @description Parses instruction into opcode and operand (+other data)
        /// @argument instruction Takes a string and parses it into instruction object
        Parse: function(instruction, index=0) {
            let Instruction = instruction.trim(), Opcode = -1, Operand = undefined;
            if (Instruction[0] in novm.Parser.Instructions) {
                Opcode = novm.Parser.Instructions[Instruction[0]].Opcode;
                Operand = novm.Parser.Type(Instruction.slice(1));
            } else {
                if (Instruction[0] != "." && Instruction.length > 0) {
                    novm.Parser.Error("Could not parse instruction \"" + Instruction + "\", unknown opcode met at " + index + ".");
                    return undefined;
                }
            }
            return {Opcode: Opcode, Operand: Operand, Type: typeof Operand, Raw: Instruction.slice(1)};
        },
        /// @description Parses a block of instructions into a function list
        ParseBlock: function(instructions, FunctionList={}) {
            let InstructionBlock = instructions.split("\n"), InstructionIndex = 0, FunctionName = "main", Content = [], Labels = {};
            for(let i = 0; i < InstructionBlock.length; i++) {
                InstructionBlock[i].split(",").forEach(Instruction => {
                    let Parsed = novm.Parser.Parse(Instruction, i);
                    if (Parsed != undefined) {
                        switch (Parsed.Opcode) {
                            case -1: break;
                            case 0xFF: { // Declare
                                if (Content.length > 0) {
                                    FunctionList[FunctionName] = Content;
                                    Content = [];
                                }
                                FunctionName = Parsed.Operand;
                                break;
                            }
                            default: {
                                Content.push(Parsed);
                                InstructionIndex++;
                                break;
                            }
                        }
                    }
                });
            }

            if (Content.length > 0) {
                for(var i = 0; i < Content.length; i++) {
                    if (Content[i].Opcode == 0xFE) {
                        Labels[Content[i].Operand] = i;
                        Content.splice(i--, 1);
                    }
                }
                FunctionList[FunctionName] = Content;
            }
            console.log(Content);
            console.log(Labels);
            return {Functions: FunctionList, Labels: Labels};
        },
        /// @description Gets an operand and casts to the correct type
        /// @argument operand The operand to parse
        Type: function(operand) {
            let AsNumber = parseFloat(operand);
            if (isNaN(AsNumber) == true) return operand;
            return AsNumber;
        },
        /// @description Throws an error
        Error: function(message, index=-1) {
            console.error("[PARSE" + (index > -1 ? ", @" + index : "") + "] " + message);
        }
    },
    // includes native functions
    Interface: {
        // @description A simple function to print to the native console
        "__print__": function(stack) {
            console.log(stack.pop());
        }
    }
}


let game = `.novm hypothetical game setup - snake
|main
    &create

|create
    .room size
    >16, <, =roomW, =roomH    

    .player position
    >8, <, =snakeX, =snakeY

|update
    >32, &__keydown__

|render`;

let loop = `
    |main
        >0, =i

        !loop
        >"i"=, @i, +
        &__print__

        >1, @i, +, =i
        @i, >10, ?<, $loop

        >loop finished
        &__print__

`;

let test = `
    |main
    >1
    >2, >3, >4
    !labeltest
    >5
    +
`;

let program = novm.Parser.ParseBlock(loop);
novm.Core.Execute(program.Functions["main"], undefined, undefined, undefined, undefined, program);


/*
novm.Core.Execute([
    novm.Parser.Parse(">Hello World!"),
    novm.Parser.Parse("&__print__")
]);
*/