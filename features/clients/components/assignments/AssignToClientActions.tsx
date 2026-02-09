import React, { useCallback, useMemo, useState } from "react";
import { View } from "react-native";

import { useAppTranslation } from "@/shared/i18n/useAppTranslation";
import { Button, Icon, useTheme, HStack } from "@/shared/ui";

import { AssignToClientsSheet, type AssignItemMode } from "./AssignToClientsSheet";
import { AssignTypeSheet } from "./AssignTypeSheet";
import { ChooseProgramTemplateSheet } from "./ChooseProgramTemplateSheet";
import { ChooseWorkoutTemplateSheet } from "./ChooseWorkoutTemplateSheet";

export function AssignToClientActions(props: {
  clientId: string;
  variant?: "compact" | "full";
  onAssigned?: () => void;
}) {
  const theme = useTheme();
  const { t } = useAppTranslation();

  const variant = props.variant ?? "full";

  const [typeOpen, setTypeOpen] = useState(false);
  const [chooseWorkoutOpen, setChooseWorkoutOpen] = useState(false);
  const [chooseProgramOpen, setChooseProgramOpen] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<AssignItemMode>("workout");
  const [item, setItem] = useState<{ id: string; title: string } | null>(null);

  const openAssign = useCallback((mode: AssignItemMode, nextItem: { id: string; title: string }) => {
    setAssignMode(mode);
    setItem(nextItem);
    setAssignOpen(true);
  }, []);

  const onPickWorkout = useCallback(
    (workoutId: string, title: string) => {
      openAssign("workout", { id: workoutId, title });
    },
    [openAssign]
  );

  const onPickProgram = useCallback(
    (programId: string, title: string) => {
      openAssign("program", { id: programId, title });
    },
    [openAssign]
  );

  const cta = useMemo(() => {
    if (variant === "compact") {
      return (
        <Button
          variant="secondary"
          height={40}
          onPress={() => setTypeOpen(true)}
          left={<Icon name="add-circle-outline" size={18} color={theme.colors.text} />}
        >
          {t("clients.assign", "Assign")}
        </Button>
      );
    }

    return (
      <HStack gap={10}>
        <Button
          variant="secondary"
          height={40}
          fullWidth
          style={{ flex: 1 }}
          onPress={() => setChooseWorkoutOpen(true)}
          left={<Icon name="barbell-outline" size={18} color={theme.colors.text} />}
        >
          {t("clients.assignWorkout", "Assign workout")}
        </Button>
        <Button
          height={40}
          fullWidth
          style={{ flex: 1 }}
          onPress={() => setChooseProgramOpen(true)}
          left={<Icon name="layers-outline" size={18} color={theme.colors.text} />}
        >
          {t("clients.assignProgram", "Assign program")}
        </Button>
      </HStack>
    );
  }, [t, theme.colors, variant]);

  return (
    <>
      {cta}

      <AssignTypeSheet
        visible={typeOpen}
        onClose={() => setTypeOpen(false)}
        onPickWorkout={() => setChooseWorkoutOpen(true)}
        onPickProgram={() => setChooseProgramOpen(true)}
      />

      <ChooseWorkoutTemplateSheet
        visible={chooseWorkoutOpen}
        onClose={() => setChooseWorkoutOpen(false)}
        onSelectWorkoutTemplate={onPickWorkout}
      />

      <ChooseProgramTemplateSheet
        visible={chooseProgramOpen}
        onClose={() => setChooseProgramOpen(false)}
        onSelectProgramTemplate={onPickProgram}
      />

      {item ? (
        <AssignToClientsSheet
          visible={assignOpen}
          onClose={() => setAssignOpen(false)}
          mode={assignMode}
          item={item}
          initialClientIds={[props.clientId]}
          onAssigned={props.onAssigned}
        />
      ) : null}
    </>
  );
}

