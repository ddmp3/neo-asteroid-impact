const db = require('../data/earthCraterDatabase.js');

const split = db.trainTestSplit(0.6, 42);
console.log('Training craters missing params:');
for (const c of split.train) {
  if (!c.impactor || !c.impactor.velocity_m_s || !c.impactor.angle_deg) {
    console.log('  -', c.name, '- missing:',
      !c.impactor ? 'impactor' : '',
      !c.impactor?.velocity_m_s ? 'velocity' : '',
      !c.impactor?.angle_deg ? 'angle' : ''
    );
  }
}

console.log('\nTest craters missing params:');
for (const c of split.test) {
  if (!c.impactor || !c.impactor.velocity_m_s || !c.impactor.angle_deg) {
    console.log('  -', c.name, '- missing:',
      !c.impactor ? 'impactor' : '',
      !c.impactor?.velocity_m_s ? 'velocity' : '',
      !c.impactor?.angle_deg ? 'angle' : ''
    );
  }
}
