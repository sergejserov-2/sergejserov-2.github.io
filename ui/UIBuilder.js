export class UIBuilder {

 formatRoundResult(vm) {
  return {
   distance: vm.round?.distance ?? 0,
   score: vm.round?.score ?? 0,
   progress: vm.round?.progress ?? 0
  };
 }

 formatGameResult(vm) {
  return {
   totalScore: vm.totalScore ?? 0,
   rounds: vm.rounds ?? []
  };
 }

 formatHUD(vm) {
  return {
   roundText: vm.roundText ?? `Раунд ${vm.currentRoundIndex ?? 0}`,
   totalText: vm.totalText ?? `Счёт: ${vm.totalScore ?? 0}`,
   timeText: vm.timeText ?? "",
   movesText: vm.movesText ?? "",
   progress: vm.progress ?? 0
  };
 }
}
