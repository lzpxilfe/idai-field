import { SAMPLE_PROJECT_ID } from '@/constants/sample-project';

export interface ProjectNameValidation {
  alreadyExists: boolean;
  hasUnsafeCharacters: boolean;
  isAvailable: boolean;
  isPresent: boolean;
  isReserved: boolean;
  isTooLong: boolean;
  projectId: string;
}

export const PROJECT_IDENTIFIER_MAX_LENGTH = 30;
export const LOCAL_PROJECT_NAME_MAX_LENGTH = 80;

interface ProjectNameValidationOptions {
  mode?: 'server' | 'local';
}

export const validateProjectName = (
  projectName: string,
  existingProjects: readonly string[] = [],
  options: ProjectNameValidationOptions = {}
): ProjectNameValidation => {
  const validationMode = options.mode ?? 'server';
  const projectId = normalizeProjectId(projectName);
  const projectLookupKey = createProjectLookupKey(projectId);
  const isPresent = projectId.length > 0;
  const alreadyExists = isPresent && existingProjects.some(
    (existingProject) =>
      createProjectLookupKey(normalizeProjectId(existingProject)) === projectLookupKey
  );
  const isReserved =
    projectLookupKey === createProjectLookupKey(SAMPLE_PROJECT_ID);
  const maxLength = validationMode === 'local'
    ? LOCAL_PROJECT_NAME_MAX_LENGTH
    : PROJECT_IDENTIFIER_MAX_LENGTH;
  const isTooLong = projectId.length > maxLength;
  const hasUnsafeCharacters =
    isPresent
    && !isReserved
    && (validationMode === 'local'
      ? !hasLocalProjectName(projectId)
      : !hasServerCompatibleProjectName(projectId));

  return {
    alreadyExists,
    hasUnsafeCharacters,
    isAvailable:
      isPresent && !alreadyExists && !isReserved && !isTooLong && !hasUnsafeCharacters,
    isPresent,
    isReserved,
    isTooLong,
    projectId,
  };
};

export const getProjectNameInvalidText = (
  validation: ProjectNameValidation
): string =>
  validation.alreadyExists
    ? '이미 있는 프로젝트 이름입니다.'
    : validation.isReserved
      ? '앱에서 쓰는 예약 이름입니다.'
      : validation.isTooLong || validation.hasUnsafeCharacters
        ? '프로젝트 이름은 소문자로 시작하고 소문자, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있으며 30자 이하여야 합니다.'
        : '프로젝트 이름을 입력해야 합니다.';

export const getLocalProjectNameInvalidText = (
  validation: ProjectNameValidation
): string =>
  validation.alreadyExists
    ? '이미 있는 프로젝트 이름입니다.'
    : validation.isReserved
      ? '앱에서 쓰는 예약 이름입니다.'
      : validation.isTooLong
        ? `프로젝트 이름은 ${LOCAL_PROJECT_NAME_MAX_LENGTH}자 이하로 입력하세요.`
        : validation.hasUnsafeCharacters
          ? '프로젝트 이름에는 / \\ : * ? " < > | 문자나 줄바꿈을 사용할 수 없습니다. 한글, 숫자, 영문, 띄어쓰기는 사용할 수 있습니다.'
          : '프로젝트 이름을 입력해야 합니다.';

const normalizeProjectId = (projectName: string): string => projectName.trim();

const createProjectLookupKey = (projectId: string): string =>
  projectId.toLocaleLowerCase();

const hasServerCompatibleProjectName = (projectId: string): boolean =>
  /^[a-z][0-9a-z_-]*$/.test(projectId);

const hasLocalProjectName = (projectId: string): boolean =>
  !/[\u0000-\u001f\u007f/\\:*?"<>|]/.test(projectId);
