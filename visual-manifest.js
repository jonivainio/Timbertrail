/* One registry for the local overhaul's original art families. */
(function(root){'use strict';
  const manifest=Object.freeze({
    revision:'overhaul-material-light-ui-2',status:'development',enabled:true,
    artWidth:640,outdoorZoom:1.2,pondZoom:1.08,buildToken:null,
    assets:Object.freeze([Object.freeze(['artTrees','art-v2/trees']),Object.freeze(['artForest','art-v2/forest-groups']),Object.freeze(['artGround','art-v2/ground-clusters']),Object.freeze(['artCabin','art-v2/cabin']),Object.freeze(['artSoil','art-v2/soil']),Object.freeze(['artYard','art-v2/yard']),Object.freeze(['artKajo','art-v2/kajo']),Object.freeze(['artTraveller','art-v2/traveller']),Object.freeze(['artTravellerActions','art-v2/traveller-actions']),Object.freeze(['artTravellerFishing','art-v2/traveller-fishing']),Object.freeze(['artTravellerBow','art-v2/traveller-bow']),Object.freeze(['artKajoCabin','art-v2/kajo-cabin']),Object.freeze(['artInterior','art-v2/interior']),Object.freeze(['artJournal','art-v2/journal']),Object.freeze(['artJournalCover','art-v2/journal-cover'])])
  });
  root.PEVisualManifest=manifest;
  if(typeof module!=='undefined')module.exports=manifest;
})(typeof window!=='undefined'?window:globalThis);
