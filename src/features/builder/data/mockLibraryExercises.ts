export type LibraryExercisePickRow = {
    id: string;
    title: string;
    videoUrl?: string | null;
  };
  
  export const MOCK_LIBRARY_EXERCISES: LibraryExercisePickRow[] = [
    {
      id: "ex_1",
      title: "Incline Dumbbell Press",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
      id: "ex_2",
      title: "Lat Pulldown (Wide Grip)",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    },
    {
      id: "ex_3",
      title: "Cable Lateral Raise",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    },
    {
      id: "ex_4",
      title: "Bulgarian Split Squat",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    },
  ];
  