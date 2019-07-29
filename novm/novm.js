/// novm.js by Nommiin (2019)
novm = {
    // the version
    Version: 0.2,
    // includes runtime
    Core: {
        /// @description Takes instructions and runs in a unique context
        /// @argument input List of parsed instructions
        Execute: function(input, Index=0, Layer=1, Stack=[], References=[], Functions={}) {
            if (Layer > 32) {
                novm.Core.Error("Could not invoke function, maximum recursion depth met.");
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
                            novm.Core.Error("Could not duplicate stack top, stack is empty.", Index);
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
                        if (Instruction.Operand in Functions) {
                            Found = true;
                            let Return = novm.Core.Execute(Functions[Instruction.Operand], undefined, Layer + 1, Stack, References, Functions);
                            if (Return == undefined) {
                                novm.Core.Error("Could not invoke function \"" + Instruction.Operand + "\", an error occured.", Index);
                                Running = false;
                            } else Stack = Return;
                        }
                        if (Found == false) {
                            novm.Core.Error("Could not invoke function \"" + Instruction.Operand + "\", function does not exist.", Index);
                            Running = false;
                        }
                        break;
                    }

                    case 0x03: { // Add
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform addition operation, stack does not contain at least 2 values.", Index);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a + b);
                        }
                        break;
                    }

                    case 0x04: { // Subtract
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform subtraction operation, stack does not contain at least 2 values.", Index);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a - b);
                        }
                        break;
                    }

                    case 0x05: { // Multiply
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform multiplication operation, stack does not contain at least 2 values.", Index);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a - b);
                        }
                        break;
                    }

                    case 0x06: { // Divide
                        if (Stack.length < 2) {
                            novm.Core.Error("Could not perform division operation, stack does not contain at least 2 values.", Index);
                            Running = false;
                        } else {
                            let b = Stack.pop(), a = Stack.pop();
                            Stack.push(a / b);
                        }
                        break;
                    }

                    case 0x07: { // Assign
                        References[Index] = Instruction.Operand;
                        break;
                    }

                    case 0x08: { // Reference
                        let Ref = References[Instruction.Operand];
                        if (Instruction.Operand < 0) Ref = References[Index + Instruction.Operand];
                        if (Ref == undefined) {
                            novm.Core.Error("Could not perform reference value at " + Instruction.Operand + ", no reference found.", Index);
                            Running = false;
                        } else Stack.push(Ref);
                        break;
                    }
                }
                Index++;
            }
            return Stack;
        },
        Error: function(message, Index=1) {
            console.log("[CORE, @" + Index.toString() + "]: " + message);
        }
    },
    // includes instruction parser
    Parser: {
        /// @description A list of instructions, containing both runtime and meta data
        Instructions: {
            ">": {
                Name: "Push",
                Opcode: 0x00
            },
            "<": {
                Name: "Duplicate",
                Opcode: 0x01
            },
            "&": {
                Name: "Invoke",
                Opcode: 0x02
            },
            "+": {
                Name: "Add",
                Opcode: 0x03
            },
            "-": {
                Name: "Subtract",
                Opcode: 0x04
            },
            "*": {
                Name: "Multiply",
                Opcode: 0x05
            },
            "/": {
                Name: "Divide",
                Opcode: 0x06
            },
            "=": {
                Name: "Assign",
                Opcode: 0x07
            },
            "^": {
                Name: "Reference",
                Opcode: 0x08
            },
            "|": {
                Name: "Declare",
                Opcode: 0xFF
            }
        },
        /// @description Parses instruction into opcode and operand (+other data)
        /// @argument instruction Takes a string and parses it into instruction object
        Parse: function(instruction) {
            let Instruction = instruction.trim(), Opcode = -1;
            if (Instruction[0] in novm.Parser.Instructions) {
                Opcode = novm.Parser.Instructions[Instruction[0]].Opcode;
            } else {
                if (Instruction[0] != "." && Instruction.length > 0) {
                    novm.Parser.Error("Could not parse instruction, unknown opcode met.");
                    return undefined;
                }
            }
            return {Opcode: Opcode, Operand: novm.Parser.Type(Instruction.slice(1))};
        },
        /// @description Parses a block of instructions into a function list
        ParseBlock: function(instructions, FunctionList={}) {
            let InstructionBlock = instructions.split("\n"), FunctionName = "main", Content = [];
            for(let i = 0; i < InstructionBlock.length; i++) {
                InstructionBlock[i].split(",").forEach(Instruction => {
                    let Parsed = novm.Parser.Parse(Instruction);
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
                            default: Content.push(Parsed); break;
                        }
                    }
                });
            }
            if (Content.length > 0) FunctionList[FunctionName] = Content;
            return FunctionList;
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


let program = novm.Parser.ParseBlock(`
    =32
    =64
    ^-1
    &__print__
`);

novm.Core.Execute(program["main"], undefined, undefined, undefined, undefined, program);


/*
novm.Core.Execute([
    novm.Parser.Parse(">Hello World!"),
    novm.Parser.Parse("&__print__")
]);
*/