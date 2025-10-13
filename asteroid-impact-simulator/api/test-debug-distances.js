/**
 * DEBUG: Show distances to all anchors for test cases
 */

const AtmosphericFragmentation = require('./src/services/atmosphericFragmentation');

const frag = new AtmosphericFragmentation();

const testCase = {
    name: 'Small rocky asteroid (near Chelyabinsk)',
    D: 22,
    V: 18500,
    θ: 20,
    comp: 'rocky',
    ρ: 3250
};

console.log('Test case:', testCase.name);
console.log('Parameters:', testCase);
console.log();

// Calculate distances manually
console.log('Distances to all anchors:');
frag.fragmentationAnchors.forEach(anchor => {
    const dist = frag.calculateDistance(testCase, anchor);
    console.log(`  ${anchor.name}: ${dist.toFixed(4)}`);
});

console.log();
console.log('With only 3 anchors total, nearest[2] is always the 3rd anchor.');
console.log('If the case is IRON but anchors are mostly ROCKY, distance will be large.');
console.log('Solution: Check nearest[0] distance instead of nearest[2].');
