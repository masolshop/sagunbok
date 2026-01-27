// JWT 또는 세션 기반 인증 미들웨어
export const authenticateConsultant = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // TODO: JWT 토큰 검증 로직 구현
  // 현재는 간단한 헤더 체크만
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '인증이 필요합니다. 로그인 해주세요.'
    });
  }

  // 임시: 토큰에서 사용자 정보 추출 (실제로는 JWT 검증)
  const token = authHeader.split(' ')[1];
  
  // TODO: 실제 JWT 검증 및 사용자 정보 추출
  // 현재는 mock 데이터
  req.user = {
    id: 'consultant_001',
    name: '이종근',
    email: 'consultant@sagunbok.com',
    userType: 'consultant',
    position: '단장'
  };

  next();
};

// 컨설턴트 권한 확인
export const requireConsultant = (req, res, next) => {
  if (!req.user || req.user.userType !== 'consultant') {
    return res.status(403).json({
      error: 'Forbidden',
      message: '컨설턴트 권한이 필요합니다.'
    });
  }
  next();
};

// API Key 검증 (선택적)
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API Key가 필요합니다.'
    });
  }

  // TODO: API Key 검증
  // 현재는 환경변수와 비교
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '유효하지 않은 API Key입니다.'
    });
  }

  next();
};
