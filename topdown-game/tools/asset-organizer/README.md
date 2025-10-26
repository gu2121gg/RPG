# Asset Organizer for Top-Down Game

## Overview
The Asset Organizer is a tool designed to help manage and organize the assets used in the Top-Down Game project. This tool simplifies the process of loading and utilizing various assets, such as tilesets, sprites, and audio files.

## Directory Structure
The assets are organized into the following directories:

- **tilesets/**: Contains tileset files used for map generation.
- **sprites/**: Contains sprite files for game entities.
- **audio/**: Contains audio files for sound effects and music.
- **meta/**: Contains metadata files that provide configuration information about the assets.

## Usage
To use the Asset Organizer, follow these steps:

1. **Add Assets**: Place your asset files in the appropriate directories within the `assets` folder.
2. **Load Assets**: Use the provided loader functions in `src/assets/loader.ts` to load the assets into your game.
3. **Generate Maps**: Utilize the `MapGenerator` class in `src/engine/map-generator.ts` to create maps based on the tilesets available in the `tilesets` directory.

## Best Practices
- Keep your asset files organized by type to make it easier to locate and manage them.
- Use descriptive names for your asset files to ensure clarity and ease of use.
- Regularly update the metadata in the `meta` directory to reflect any changes in your assets.

## Contribution
If you would like to contribute to the Asset Organizer or have suggestions for improvements, please feel free to submit a pull request or open an issue in the project's repository.