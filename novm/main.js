Page = {
    Input: undefined,
    Output: undefined,
    Stack: [],
    References: [],
    Functions: {},
    Write: function(value, color="white") {
        if (Page.Output != undefined) {
            Page.Output.innerHTML += "<span style='color: " + color + ";'>" + value + "</span>";
        }
    },
    WriteLine: function(value, color="white") {
        Page.Write(value + "\n", color);
    },
    Process: function(input) {
        if (input.keyCode != 13) return;
        let Instruction = Page.Input.value.trim();
        Page.Write(Instruction, "gray");
        let Offset = Page.Output.innerHTML.length;
        switch (Instruction[0]) {
            case ".": { // Comment/Command
                if (Instruction[1] == "?") {
                    Page.ProcessMeta(Instruction.slice(2));
                }
                break;
            }

            default: { // Instruction
                let Instructions = [];
                Instruction.split(",").forEach(_Instruction => {
                    Instructions.push(novm.Parser.Parse(_Instruction.trim()));
                });
                novm.Core.Execute(Instructions, undefined, undefined, Page.Stack, Page.References, Page.Functions);
            }
        }
        Page.Input.value = "";
        if (Offset < Page.Output.innerHTML.length) {
            Page.Output.innerHTML = Page.Output.innerHTML.slice(0, Offset) + " <span style='color: gray'>-></span> " + Page.Output.innerHTML.slice(Offset);
        } else {
            Page.Write("\n");
        }
    },
    ProcessMeta: function(input) {
        let End = input.indexOf(" ");
        switch (input.slice(0, End > 0 ? End : input.length)) {
            case "help": case "h": { // Help Command
                let Help = "\nRuntime Opcodes:\n";
                for(Opcode in novm.Parser.Instructions) {
                    Help += "- " + novm.Parser.Instructions[Opcode].Name + ": " + Opcode + "\n";
                } 
                Help += "\nRuntime Functions:\n";
                for(Interface in novm.Interface) {
                    Help += "- " + Interface + "\n";
                }
                Page.WriteLine(Help + "\nRuntime Information:\nVersion: " + novm.Version + "\n\nMeta Commands:\n- .?help - Prints out help\n- .?clear - Clears both input and output\n- .?stack - Prints out the current stack\n- .?parse - Parses an instruction and prints it\n- .?reset - Clears the stack and resets the VM context\n");
                break;
            }

            case "clear": case "c": {
                this.Output.innerText = "";
                break;
            }

            case "stack": case "s": {
                Page.WriteLine("Stack: [" + Page.Stack.join(", ") + "]");
                break;
            }

            case "parse": case "p": {
                let Instruction = input.slice(5).trim();
                Page.WriteLine("Parsed: (" + Instruction + " -> " + JSON.stringify(novm.Parser.Parse(Instruction)) + ")");
                break;
            }

            case "reset": case "r": {
                Page.Stack = [];
                break;
            }
        }
    },
    Load: function() {
        Page.Input = document.getElementById("command");
        Page.Output = document.getElementById("output");
        Page.Input.addEventListener("keydown", Page.Process);
        Page.WriteLine(`novm (v${novm.Version}) interactive!\ntype an instruction and press enter to execute it, type .?help to get help`);

        // override interface functions
        novm.Interface["__print__"] = function(s) {
            Page.WriteLine("[EXEC]: __print__ -> " + s.pop());
        }
    }
}