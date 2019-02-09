const ethJsUtil = require('aion-lib').crypto;
const MerkleTree = require('./merkle-tree');

function keccak256Buffer(el) {
	return Buffer.from(ethJsUtil.keccak256(el), 'hex');
}

Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
}

Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
}

function calculatePossiblePoints(lat, lon) {
  const COORDS_INCREMENT = 0.0001,
				distance = 0.020,
				radius = 6371.0,
				quotient = distance/radius;

  const maxLat = lat + Math.degrees(quotient);
  const minLat = lat - Math.degrees(quotient);

  const maxLon = lon + Math.degrees(quotient);
  const minLon = lon - Math.degrees(quotient);

  var latList = [];
  var lonList = [];
  var coordList = [];

  var currentLat = minLat;
  var currentLon = minLon;

  while(currentLat <= maxLat) {
    latList.push(currentLat);
    currentLat += COORDS_INCREMENT;
  }

  while(currentLon <= maxLon) {
    lonList.push(currentLon);
    currentLon += COORDS_INCREMENT;
  }

  for (var i = 0; i < latList.length; i++) {
    for (var j = 0; j < lonList.length; j++) {
      coordList.push([latList[i].toFixed(4),lonList[j].toFixed(4)]);
    }
  }

  return coordList;
}

function generateMerkleTreeLeaves(lat, lon) {
	var pointHashes = calculatePossiblePoints(lat, lon)
											.map(point => point[0] + point[1]);

	return pointHashes;
}

module.exports.generateMerkleTree = function(lat, lon) {
	const leaves = generateMerkleTreeLeaves(lat, lon);

	return new MerkleTree(leaves);
}

// Creates a String array with all the layers of the three, except the leaves and the root
module.exports.encodeMerkleBody = function(tree) {
	debugger;
	var body = tree.layers.slice();

	// Remove root and leaves
	body.shift();
	body.pop();
	body = body.map(layerArr => layerArr.map(function(elem) {
		return elem.toString('hex');
	}));

	var result = [];

	for (var i = 0; i < body.length; i++) {
		result.push(body[i].join(','));
	}

	return result.slice().reverse().join('-');
}

const ZERO_HEX = false;
const ONE_HEX = true;

module.exports.generatePlayerSubmission = function(lat, lon, merkleBody) {
	var points = calculatePossiblePoints(lat, lon),
			pointsHashes = points.map(point => keccak256Buffer(point[0] + point[1])).sort(Buffer.compare),
			merkleLayers = merkleBody.split('-').map(elem => elem.split(',')),
			deepestLevel = merkleLayers[merkleLayers.length - 1],
			matchingLeaves = [],
			proof = [];

	for (var i = 0; i < pointsHashes.length; i++) {
		var pointHash = pointsHashes[i];
		for (var j = 0; j < pointsHashes.length; j++) {
			var siblingPointHash = pointsHashes[j];
			if (matchingLeaves.length === 0 && Buffer.compare(pointHash, siblingPointHash) !== 0) {
				var possibleHash = keccak256Buffer(Buffer.concat([pointHash, siblingPointHash])).toString('hex');
				for (var k = 0; k < deepestLevel.length; k++) {
					var deepestLevelHash = deepestLevel[k];

					if (possibleHash === deepestLevelHash) {
						matchingLeaves.push({
							left: pointHash,
							right: siblingPointHash,
							leftIndex: k,
							rightIndex: k + 1
						});
						break;
					}
				}
			}
		}
	}

	// Calculate proof
	var order = [];
	const merkleLayersReversed = merkleLayers.slice().reverse();
	proof.push(matchingLeaves[0].right.toString('hex'));
	var index = matchingLeaves[0].leftIndex;
	var firstElementOrder = Buffer.compare(matchingLeaves[0].left, matchingLeaves[0].right) === -1 ? ZERO_HEX : ONE_HEX;
	order.push(firstElementOrder);
	for (let i = 0; i < merkleLayersReversed.length; i++) {
		const layer = merkleLayersReversed[i];
		const isRightNode = index % 2;
		const pairIndex = (isRightNode ? index - 1 : index + 1);

		if (pairIndex < layer.length) {
			proof.push(layer[pairIndex]);
			const buff1 = Buffer.from(layer[index], 'hex');
			const buff2 = Buffer.from(layer[pairIndex], 'hex');
			var elementOrder = Buffer.compare(buff1, buff2) === -1 ? ZERO_HEX : ONE_HEX;
			order.push(elementOrder);
		}
		// set index to parent index
		index = (index / 2)|0
	}
	  
	if (order.length !== proof.length) {
		console.error(order);
		console.error(proof);
		throw new Error('Invalid order for merkle proof');
	}

	return {
		proof: proof,
		answer: matchingLeaves[0].left.toString('hex'),
		order: order
	}
}

// All inputs must be buffers (proof is an array of buffers)
module.exports.verifyProof = function(proof, root, leaf) {
	//proof.map(proofEle => console.log(proofEle.toString('hex')));
  	var computedHash = leaf;

	for (var i = 0; i < proof.length; i++) {
		var proofElement = proof[i],
			comparison = Buffer.compare(computedHash, proofElement);

		console.log("Computed hash: " + computedHash.toString('hex') + " vs proofElement: " + proofElement.toString('hex'));
		console.log("Comparison result: " + comparison);
		if (comparison === -1) {
			computedHash = keccak256Buffer(Buffer.concat([computedHash, proofElement]));
		} else {
			computedHash = keccak256Buffer(Buffer.concat([proofElement, computedHash]));
		}
	}

  // Check if the computed hash (root) is equal to the provided root
  console.log("Final comparison computed hash: " + computedHash.toString('hex') + " vs root: " + root.toString('hex'));
  console.log("Computed hash vs root comparison: " + Buffer.compare(computedHash, root));
  return Buffer.compare(computedHash,root) === 0;
}
