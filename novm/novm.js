/// novm.js by Nommiin (2019)
novm = {
    // the version
    Version: 0.2,
    // includes runtime
    Core: {
        /// @description Takes instructions and runs in a unique context
        /// @argument input List of parsed instructions
        Execute: function(input, Stack=[]) {
            input.forEach(Instruction => {
                switch (Instruction.Opcode) {

                    case 0x00: { // Push
                        Stack.push(Instruction.Operand);
                        break;
                    }

                    case 0x01: { // Duplicate
                        if (Stack.length < 1) {}// TODO: Error @ Not Enough Values
                        Stack.push(Stack[Stack.length - 1]);
                        break;
                    }

                    case 0x02: { // Invoke
                        let Found = false;
                        if (Instruction.Operand in novm.Interface) {
                            Found = true;
                            novm.Interface[Instruction.Operand](Stack);
                        }

                        if (Found == false) // TODO: Error @ Unknown Function
                        break;
                    }

                    case 0x03: { // Define
                        // TODO: Allow for function definitions
                        break;
                    }

                    case 0x04: { // Add
                        if (Stack.length < 2) {}// TODO: Error @ Not Enough Values
                        let a = Stack.pop(), b = Stack.pop();
                        Stack.push(b + a);
                        break;
                    }

                    case 0x05: { // Subtract
                        if (Stack.length < 2) {}// TODO: Error @ Not Enough Values
                        let a = Stack.pop(), b = Stack.pop();
                        Stack.push(b - a);
                        break;
                    }

                    case 0x06: { // Divide
                        if (Stack.length < 2) {}// TODO: Error @ Not Enough Values
                        let a = Stack.pop(), b = Stack.pop();
                        Stack.push(b / a);
                        break;
                    }

                    case 0x07: { // Multiply
                        if (Stack.length < 2) {}// TODO: Error @ Not Enough Values
                        let a = Stack.pop(), b = Stack.pop();
                        Stack.push(b * a);
                        break;
                    }

                    default: {
                        // TODO: Error @ Bad Opcode
                        console.log("BAD OPCODE");
                        break;
                    }
                }

            });

            console.log(Stack);
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
                Opcode: 0x04
            },
            "-": {
                Name: "Subtract",
                Opcode: 0x05
            },
            "/": {
                Name: "Divide",
                Opcode: 0x06
            },
            "*": {
                Name: "Multiply",
                Opcode: 0x07
            }
        },
        /// @description Parses instruction into opcode and operand (+other data)
        /// @argument instruction Takes a string and parses it into instruction object
        Parse: function(instruction) {
            let Instruction = instruction.trim(), Opcode = -1;
            if (Instruction[0] in novm.Parser.Instructions) {
                Opcode = novm.Parser.Instructions[Instruction[0]].Opcode;
            } else {
                // TODO: Error @ Unknown Opcode
            }
            return {Opcode: Opcode, Operand: novm.Parser.Type(Instruction.slice(1))};
        },
        /// @description Gets an operand and casts to the correct type
        /// @argument operand The operand to parse
        Type: function(operand) {
            let AsNumber = parseFloat(operand);
            if (isNaN(AsNumber) == true) return operand;
            return AsNumber;
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

/*
novm.Core.Execute([
    novm.Parser.Parse(">Hello World!"),
    novm.Parser.Parse("&__print__")
]);
*/