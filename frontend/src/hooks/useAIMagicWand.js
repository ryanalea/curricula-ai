import { useState } from 'react';
import { courseApi } from '../services/courseApi';
import { useCourse } from '../context/CourseContext';
import { useUI } from '../context/UIContext';

export function useAIMagicWand() {
  const { sessionId, activeLessonId, courseData, setCourseData } = useCourse();
  const { toast } = useUI();
  const [isWandProcessing, setIsWandProcessing] = useState(false);
  const [sectionLoading, setSectionLoading] = useState({});

  const executeWandAction = async (sectionType, content, action, params = {}) => {
    setIsWandProcessing(true);
    setSectionLoading((prev) => ({ ...prev, [sectionType]: true }));
    try {
      const res = await courseApi.runSectionAction({
        section_type: sectionType,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        action,
        params
      });
      toast.success(`Action '${action}' applied successfully! ✨`);
      return res.result || res;
    } catch (err) {
      toast.error(err.message || `Failed to execute ${action}`);
      throw err;
    } finally {
      setIsWandProcessing(false);
      setSectionLoading((prev) => ({ ...prev, [sectionType]: false }));
    }
  };

  return {
    isWandProcessing,
    sectionLoading,
    executeWandAction
  };
}
