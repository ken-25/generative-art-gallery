window.StudyControlDefinitions={
 rule:{label:'規則',help:'芽（X）を書き換える規則。二股は芽が左右に分かれ、互い違いは幹に沿って左右交互に枝を出し、三方は左右と正面の三つに分かれます。'},
 generations:{label:'世代数',help:'すべての芽を同時に書き換える回数。0では幹だけ、1世代ごとに枝が増えます。上限を超える場合は手前の世代で止めます。',control:'number',unit:''},
 angle:{label:'分岐角',help:'枝が親の向きから曲がる角度。0ではすべての枝が真上に重なります。',control:'range',unit:'°'},
 shrink:{label:'枝長の縮小率',help:'分岐するたびに枝の長さと太さに掛ける割合。1では縮まず、小さくすると先端が細かくなります。',control:'range',unit:''},
 width:{label:'幹の線幅',help:'幹の太さ。枝は縮小率に合わせて細くなります。',control:'range',unit:''}
};
