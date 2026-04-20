export class UIBuilder {

 formatHUD(vm) {
  return {
   roundText: vm.type === "ROUND_VM"
    ? `Раунд ${vm.index + 1}`
    : `Игра`,
   totalText: `Раунды: ${vm.totalRounds}`,
   progress: vm.progress ?? 0
  };
 }

 formatResult(vm) {
  return {
   distanceText: `Дистанция: ${vm.distance} км`,
   scoreText: `Счёт: ${vm.score}`
  };
 }

 formatGame(vm) {
  return {
   statusText: `Игра завершена`,
   roundsText: `Раундов: ${vm.totalRounds}`,
   progress: vm.progress ?? 1
  };
 }
}
