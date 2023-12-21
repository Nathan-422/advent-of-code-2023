import { readFileSync } from 'node:fs'
import { Dir, Pos, getCoordFromDir, getOppositeDir } from '../grid-traversal.js'

enum Floor {
	'.',
	'/',
	'\\',
	'-',
	'|',
}

type FloorMap = {
	contents: twoDArr
	at: (map: twoDArr, pos: Pos) => Floor | Wall
}

type TreeNode = {
	children: Array<TreeNode>
	contents: BeamSeg
}

type twoDArr = string[][]

type Wall = null

type BeamSeg = {
	pos: Pos
	contents: Floor | Wall
	from: Dir
	to: Array<Dir> | null
}

function getContentsFromPos(map: twoDArr, pos: Pos): Floor | Wall {
	const { x, y } = { ...pos }
	const width = map[0].length
	const height = map.length

	if (
		x + 1 > width ||
		y + 1 > height ||
		x < 0 ||
		y < 0
	) {
		return null
	}

	const floor = map[y][x]
	let symbol: Floor
	switch (floor) {
		case '.':
			symbol = Floor['.']
			break
		case '/':
			symbol = Floor['/']
			break
		case '\\':
			symbol = Floor['\\']
			break
		case '-':
			symbol = Floor['-']
			break
		case '|':
			symbol = Floor['|']
			break
	}

	return symbol
}

function followBeamPaths(map: FloorMap, beam: BeamSeg): TreeNode[] {
	if (beam.contents === null) {
		return [{
			contents: beam,
			children: new Array()
		}]
	}

	const newChildren = new Array<BeamSeg>()
	for (let dir of beam.to) {
		const nextPos = getCoordFromDir(beam.pos, dir)
		const nextContent = map.at(map.contents, nextPos)
		const nextSeg: BeamSeg = {
			pos: nextPos,
			from: getOppositeDir(dir),
			// TODO: the to: field should be based off where it's comming from?
			to: getBeamDirectionFromDir(nextContent, getOppositeDir(dir)),
			contents: nextContent
		}
		newChildren.push(nextSeg)
	}

	return newChildren.map(segment => {
		const key = '' + segment.from + '-' + segment.pos.x + '-' + segment.pos.y

		if (energizedTiles.has(key)) {
			return {
				contents: segment,
				children: new Array()
			}
		}

		energizedTiles.set(key, segment.pos)

		return {
			contents: segment,
			children: followBeamPaths(map, segment)
		}
	})

}

function getBeamDirectionFromDir(floor: Floor, from: Dir): Array<Dir> {

	switch (floor) {
		case Floor['.']:
			return [getOppositeDir(from)]
		case Floor['/']:
			switch (from) {
				case Dir.EAST:
					return [Dir.SOUTH]
				case Dir.SOUTH:
					return [Dir.EAST]
				case Dir.WEST:
					return [Dir.NORTH]
				case Dir.NORTH:
					return [Dir.WEST]
			}
		case Floor['\\']:
			switch (from) {
				case Dir.EAST:
					return [Dir.NORTH]
				case Dir.SOUTH:
					return [Dir.WEST]
				case Dir.WEST:
					return [Dir.SOUTH]
				case Dir.NORTH:
					return [Dir.EAST]
			}
		case Floor['-']:
			if (from === Dir.NORTH || from === Dir.SOUTH) {
				return [Dir.EAST, Dir.WEST]
			}
			return [getOppositeDir(from)]
		case Floor['|']:
			if (from === Dir.EAST || from === Dir.WEST) {
				return [Dir.NORTH, Dir.SOUTH]
			}
			return [getOppositeDir(from)]
	}

}

const testFile = './test.txt'
const dataFile = './data.txt'

const data: twoDArr = readFileSync(dataFile, 'utf8').split("\n").filter((line) => line !== "").map(line => line.split(''))
const test: twoDArr = readFileSync(testFile, 'utf8').split("\n").filter((line) => line !== "").map(line => line.split(''))

const floorMap: FloorMap = {
	contents: data,
	at: getContentsFromPos
}

const height = floorMap.contents.length
const length = floorMap.contents[0].length

// TODO: START here

const start: Pos = { x: 0, y: 0 }
const firstFloorTile = floorMap.at(floorMap.contents, start)
const startingDirs = getBeamDirectionFromDir(firstFloorTile, Dir.WEST)
const pathStart: BeamSeg = {
	pos: start,
	contents: firstFloorTile,
	from: Dir.WEST,
	to: startingDirs
}
const energizedTiles = new Map<string, Pos>()
energizedTiles.set('' + pathStart.from + '-' + pathStart.pos.x + '-' + pathStart.pos.y, pathStart.pos)

const tree: TreeNode = {
	contents: pathStart,
	children: followBeamPaths(floorMap, pathStart)
}

const energizedDisplay = new Array<string[]>(height)
for (let i = 0; i < height; i++) {
	energizedDisplay[i] = new Array(length).fill('.')
}

for (let coord of energizedTiles.values()) {
	if (
		coord.x >= 0 &&
		coord.x < floorMap.contents[0].length &&
		coord.y >= 0 &&
		coord.y < floorMap.contents.length
	) {
		const floorTile = floorMap.contents[coord.y][coord.x]
		energizedDisplay[coord.y][coord.x] = floorTile === '.' ? '#' : floorTile
	}
}

// TODO: End here

// console.log(energizedDisplay.map(line => {
// 	return line.join('')
// }).join('\n'))

console.log(energizedDisplay.reduce((total, line) => {
	return total + line.reduce((lineSum, char) => {
		if (char !== '.') {
			return lineSum + 1
		}
		return lineSum + 0
	}, 0)
}, 0))
