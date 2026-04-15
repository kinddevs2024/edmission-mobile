import { StyleSheet, View } from 'react-native'

type FlagCode = 'us' | 'ru' | 'uz'

interface Props {
  code: FlagCode
  size?: number
}

function USFlag({ size }: { size: number }) {
  const h = size
  const w = Math.round(h * 1.5)
  const stripeH = h / 13
  return (
    <View style={[styles.flagBox, { width: w, height: h, borderRadius: h * 0.15 }]}>
      {Array.from({ length: 13 }, (_, i) => (
        <View
          key={i}
          style={{
            width: w,
            height: stripeH,
            backgroundColor: i % 2 === 0 ? '#B22234' : '#FFFFFF',
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: w * 0.4,
          height: stripeH * 7,
          backgroundColor: '#3C3B6E',
        }}
      />
    </View>
  )
}

function RUFlag({ size }: { size: number }) {
  const h = size
  const w = Math.round(h * 1.5)
  const stripeH = h / 3
  return (
    <View style={[styles.flagBox, { width: w, height: h, borderRadius: h * 0.15 }]}>
      <View style={{ width: w, height: stripeH, backgroundColor: '#FFFFFF' }} />
      <View style={{ width: w, height: stripeH, backgroundColor: '#0039A6' }} />
      <View style={{ width: w, height: stripeH, backgroundColor: '#D52B1E' }} />
    </View>
  )
}

function UZFlag({ size }: { size: number }) {
  const h = size
  const w = Math.round(h * 1.5)
  const band = h / 3
  const divider = h * 0.02
  return (
    <View style={[styles.flagBox, { width: w, height: h, borderRadius: h * 0.15 }]}>
      <View style={{ width: w, height: band, backgroundColor: '#0099B5' }} />
      <View style={{ width: w, height: divider, backgroundColor: '#CE1126' }} />
      <View style={{ width: w, height: band - divider * 2, backgroundColor: '#FFFFFF' }} />
      <View style={{ width: w, height: divider, backgroundColor: '#CE1126' }} />
      <View style={{ width: w, height: band, backgroundColor: '#1EB53A' }} />
    </View>
  )
}

export function CountryFlag({ code, size = 22 }: Props) {
  switch (code) {
    case 'us':
      return <USFlag size={size} />
    case 'ru':
      return <RUFlag size={size} />
    case 'uz':
      return <UZFlag size={size} />
  }
}

const styles = StyleSheet.create({
  flagBox: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
})
