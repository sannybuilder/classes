cp ../gta3/gta3.json src/assets/gta3
cp ../vc/vc.json src/assets/vc
cp ../sa/sa.json src/assets/sa

cp ../gta3/enums.json src/assets/gta3
cp ../vc/enums.json src/assets/vc
cp ../sa/enums.json src/assets/sa

cp ../gta3/classes.json src/assets/gta3
cp ../vc/classes.json src/assets/vc
cp ../sa/classes.json src/assets/sa


cd ../generator
cargo run classes ../gta3/gta3.json > ../editor/src/assets/gta3/classes.db
cargo run classes ../vc/vc.json > ../editor/src/assets/vc/classes.db
cargo run classes ../sa/sa.json > ../editor/src/assets/sa/classes.db

cargo run enums ../gta3/enums.json > ../editor/src/assets/gta3/enums.txt
cargo run enums ../vc/enums.json > ../editor/src/assets/vc/enums.txt
cargo run enums ../sa/enums.json > ../editor/src/assets/sa/enums.txt

cargo run snippets ../gta3/snippets > ../editor/src/assets/gta3/snippets.json
cargo run snippets ../vc/snippets > ../editor/src/assets/vc/snippets.json
cargo run snippets ../sa/snippets > ../editor/src/assets/sa/snippets.json

