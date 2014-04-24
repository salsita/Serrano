/**
 * Created by tomasnovella on 4/17/14.
 */


function evalCommand(implicitArgument, command) {
  implicitArgument=0;command=0; // just to shut jshint up.
}

function evalInstruction(implicitArgument, instruction) {
  implicitArgument=0;instruction=0;
}
module.exports = {
  evalCommand: evalCommand,
  evalInstruction: evalInstruction
};
