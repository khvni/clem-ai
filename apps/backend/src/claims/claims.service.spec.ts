import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma.service';
import { ClaimsGateway } from './claims.gateway';
import { Logger } from '@nestjs/common';

describe('ClaimsService', () => {
  let service: ClaimsService;
  let prismaService: PrismaService;
  let claimsGateway: ClaimsGateway;

  const mockPrismaService = {
    claim: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockClaimsGateway = {
    emitNewClaim: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ClaimsGateway,
          useValue: mockClaimsGateway,
        },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
    prismaService = module.get<PrismaService>(PrismaService);
    claimsGateway = module.get<ClaimsGateway>(ClaimsGateway);

    // Mock the agent property directly to avoid LangChain dependencies in tests
    (service as any).agent = {
      stream: jest.fn().mockResolvedValue([
        {
          triage: {
            triage_result: {
              severity: 'Medium',
              assessment: 'Test assessment',
              fraud_flags: [],
            },
          },
        },
        {
          recommend: {
            settlement_recommendation: {
              recommended_amount: 5000,
              recommendation_text: 'Test recommendation',
              next_steps: 'Test steps',
            },
          },
        },
      ]),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processNewClaim', () => {
    it('should create a claim and emit it via WebSocket', async () => {
      const mockClaimInput = {
        claimant_name: 'John Doe',
        policy_number: 'POL123',
        incident_date: '2024-01-15',
        incident_description:
          'Car accident on highway causing significant damage to front bumper and hood',
      };

      const mockCreatedClaim = {
        id: 1,
        claimantName: 'John Doe',
        policyNumber: 'POL123',
        incidentDate: new Date('2024-01-15'),
        incidentDescription:
          'Car accident on highway causing significant damage to front bumper and hood',
        triageResult: {
          severity: 'Medium',
          assessment: 'Test assessment',
          fraud_flags: [],
        },
        settlementRecommendation: {
          recommended_amount: 5000,
          recommendation_text: 'Test recommendation',
          next_steps: 'Test steps',
        },
        settlementAmount: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.claim.create.mockResolvedValue(mockCreatedClaim);

      const result = await service.processNewClaim(mockClaimInput);

      expect(mockPrismaService.claim.create).toHaveBeenCalledWith({
        data: {
          claimantName: 'John Doe',
          policyNumber: 'POL123',
          incidentDate: new Date('2024-01-15'),
          incidentDescription:
            'Car accident on highway causing significant damage to front bumper and hood',
          triageResult: {
            severity: 'Medium',
            assessment: 'Test assessment',
            fraud_flags: [],
          },
          settlementRecommendation: {
            recommended_amount: 5000,
            recommendation_text: 'Test recommendation',
            next_steps: 'Test steps',
          },
          settlementAmount: 5000,
        },
      });

      expect(mockClaimsGateway.emitNewClaim).toHaveBeenCalledWith(
        mockCreatedClaim,
      );
      expect(result).toEqual(mockCreatedClaim);
    });
  });

  describe('findAllClaims', () => {
    it('should return all claims ordered by creation date', async () => {
      const mockClaims = [
        { id: 1, claimantName: 'John Doe' },
        { id: 2, claimantName: 'Jane Smith' },
      ];

      mockPrismaService.claim.findMany.mockResolvedValue(mockClaims);

      const result = await service.findAllClaims();

      expect(mockPrismaService.claim.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockClaims);
    });
  });
});
