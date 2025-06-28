import * as ddo from './data/ddoTestData';
import * as im5_7 from './data/interestMap5_7Data';
import * as im8_9 from './data/interestMap8_9Data';
import * as im10_11 from './data/interestMap10_11Data';
import * as yovaisha from './data/yovaishaTestData';

export interface TestData {
    questions: any[];
    scales: string[];
    [key: string]: any; 
}

export interface Test {
    id: string;
    name: string;
    grades: string[];
    data: TestData;
    warning?: string;
}

export const tests: Test[] = [
    {
        id: ddo.DDO_TEST_ID,
        name: 'Опросник "Я предпочту"',
        grades: ['1-4'],
        data: ddo,
    },
    {
        id: im5_7.IM5_7_TEST_ID,
        name: 'Карта интересов (40 вопросов)',
        grades: ['5-7'],
        data: im5_7,
    },
    {
        id: im8_9.IM8_9_TEST_ID,
        name: 'Карта интересов (78 вопросов)',
        grades: ['8-9'],
        data: im8_9,
    },
    {
        id: yovaisha.YOVAISHA_TEST_ID,
        name: 'Опросник склонностей Л.Йовайши',
        grades: ['8-9', '10-11'],
        data: yovaisha,
    },
    {
        id: im10_11.IM10_11_TEST_ID,
        name: 'Карта интересов (144 вопроса)',
        grades: ['10-11'],
        data: im10_11,
        warning: '❗ *Внимание!* Этот тест содержит 144 вопроса и может занять много времени.'
    },
];

export const findTestById = (id: string): Test | undefined => tests.find(t => t.id === id);
