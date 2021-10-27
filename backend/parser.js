export class ParseClassError extends Error {
    constructor (message, tokens) {
        super('Cannot parse classes: ' + message)
        this.tokens = tokens
    }
}


export const hourToSeconds = hour => {
    const [h, m] = hour.split(':').map(i => +i)
    return h * 60 + m
}

export const parseDuration = duration => {
    const [fromLabel, toLabel] = duration.split('-')
    return { 
        duration,
        fromLabel, 
        toLabel,
        from: hourToSeconds(fromLabel),
        to: hourToSeconds(toLabel)
    }
}

export const parseSemester = semester => +semester.slice(5)
export const parseDegree = degree => degree.slice(6)
export const parseType = type => {
    const [stationary, stage] = type.split(' ', 2)
    return {
        isStationary: stationary === 'stac.',
        stage: parseRomanNumber(stage)
    }
}

export const parseRomanNumber = s => {
    const map = new Map([['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100], ['D', 500], ['M', 1000]])

    let result = map.get(s[s.length - 1])
    for (let i = s.length - 1; i > 0; --i) {
        const curr = map.get(s[i])
        const prev = map.get(s[i - 1])

        result += prev * (prev >= curr ? 1 : -1)
    }

    return result
}

export const parseClass = str => {
    const tokens = str.split(',').map(i => i.trim()).reverse()

    const last = tokens[tokens.length - 1].split(':')[0]

    switch (last) {
        case 'Konsultacje':
        case 'Inne':
            return {
                type: last.toLowerCase(),
                description: str.split(':').slice(1).join(':').trim()
            }
    }

    if (tokens[1] === 'REZERWACJE') {
        return { type: 'reservations', description: tokens[0], place: tokens[2], name: tokens[3] }
    }

    const spec = !tokens[0].startsWith('sem. ') ? tokens.shift() : undefined
    const [sem, deg, type] = tokens.splice(0, 3)
    const semester = parseSemester(sem)
    const degree = parseDegree(deg)
    const { isStationary, stage } = parseType(type)

    const isOnceEvery2Weeks = tokens[0].startsWith('tyg./')
    const isOdd = isOnceEvery2Weeks && tokens[0].endsWith('nieparzyste')
    const isEven = isOnceEvery2Weeks && !isOdd
    if (isOnceEvery2Weeks) {
        tokens.shift()
    }

    const [place, ...nameParts] = tokens
    const name = nameParts.reverse().join(', ')

    return {
        type: 'class',
        name,
        place,
        semester,
        degree,
        stage,
        spec,
        isStationary,
        isOnceEvery2Weeks,
        isOdd,
        isEven
    }

    throw new ParseClassError('unknown number of tokens', tokens)
}
