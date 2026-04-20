export class UIBuilder {

 formatRoundResult(vm) {
  return {
   distance: vm.distance,
   score: vm.score,
   progress: vm.progress
  };
 }

 formatGameResult(vm) {
  return {
   totalScore: vm.totalScore,
   rounds: vm.rounds
  };
 }

 formatHUD(vm) {
  return {
   roundText: vm.roundText,
   totalText: vm.totalText,
   timeText: vm.timeText,
   movesText: vm.movesText,
   progress: vm.progress
  };
 }
}
