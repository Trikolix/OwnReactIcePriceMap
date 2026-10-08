"""Generate static Nunito weights for GD from the bundled OFL variable font.

Requires fonttools; used only when updating fonts, never during deployment.
https://fonttools.readthedocs.io/en/latest/varLib/instancer.html
"""
import argparse
from pathlib import Path
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--fonttools-path', type=Path)
args = parser.parse_args()
if args.fonttools_path:
    sys.path.insert(0, str(args.fonttools_path.resolve()))

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font_dir = Path(__file__).resolve().parents[1] / 'backend' / 'assets' / 'fonts'
for style, weight in [('Regular', 400), ('Bold', 700)]:
    with TTFont(font_dir / 'Nunito.ttf') as source:
        axes = {axis.axisTag: axis.defaultValue for axis in source['fvar'].axes}
        axes['wght'] = weight
        font = instantiateVariableFont(source, axes, inplace=True, updateFontNames=True)
        assert 'fvar' not in font
        assert font['OS/2'].usWeightClass == weight
        target = font_dir / f'Nunito-{style}.ttf'
        font.save(target)
        print(f'{target.name}: static weight {weight}')
