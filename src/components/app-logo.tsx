import { Image } from 'expo-image'

const logoSource = require('../../assets/Глянцевый календарь с галочкой.png')

type AppLogoProps = {
  size?: number
}

export function AppLogo({ size = 48 }: AppLogoProps) {
  return (
    <Image
      accessibilityLabel="Логотип Do-Daily"
      contentFit="contain"
      source={logoSource}
      style={{ width: size, height: size }}
    />
  )
}
