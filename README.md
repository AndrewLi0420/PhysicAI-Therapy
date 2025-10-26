
# Personalized Physical Therapy App

This is a code bundle for Personalized Physical Therapy App. The original project is available at https://www.figma.com/design/y4vkudqpjAtolUpFswN7CJ/Personalized-Physical-Therapy-App.

## Features

- **Personalized Assessment**: Complete a comprehensive assessment to get tailored exercise recommendations
- **Curated Exercise Library**: 12 carefully selected physical therapy exercises designed for rehabilitation
- **Comprehensive Exercise Database**: Access to 800+ exercises from the [free-exercise-db](https://github.com/yuhonas/free-exercise-db) repository
- **Progress Tracking**: Monitor your recovery progress with detailed workout logs and charts
- **Adaptive Recommendations**: Exercises automatically adjust based on your pain level and mobility
- **Search & Filter**: Find exercises by category, difficulty, equipment, or target muscles

## Exercise Library Integration

The app now includes integration with the free-exercise-db API, providing access to over 800 exercises filtered specifically for physical therapy use. The exercise library includes:

- **Smart Filtering**: Automatically filters out exercises requiring heavy gym equipment
- **Physical Therapy Focus**: Prioritizes exercises suitable for rehabilitation
- **Advanced Search**: Search by name, instructions, target muscles, or equipment
- **Categorization**: Filter by exercise type (strength, stretching, cardio, etc.)
- **Difficulty Levels**: Filter by beginner, intermediate, advanced, or expert levels

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Tech Stack

- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- Free Exercise DB API for exercise data
